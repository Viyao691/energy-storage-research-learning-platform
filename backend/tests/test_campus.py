from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta
from pathlib import Path

import httpx
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.orm import sessionmaker


def test_parser_dates_tables_and_english_lectures():
    from app.services.campus_parse import parse_notice, discover
    html = '''<meta name="Article_PublishDate" content="2026-09-23"><h1>AI竞赛通知</h1>
    <div class="v_news_content"><table><tr><td>报名截止</td><td>2026年10月10日</td></tr>
    <tr><td>作品提交截止</td><td>2026年10月25日</td></tr></table>
    <p>联系人：某同学 13812345678 student@example.com</p></div>'''
    parsed = parse_notice(html, "AI竞赛通知")
    assert parsed.published_on == date(2026, 9, 23)
    assert [(d['kind'], d['day']) for d in parsed.dates] == [('报名', '2026-10-10'), ('提交', '2026-10-25')]
    assert '13812345678' not in parsed.excerpt and 'student@example.com' not in parsed.excerpt
    lecture = parse_notice('<h1>Perovskite</h1><div class="v_news_content">讲座时间：2026-09-18 15:30</div>', 'Perovskite', lecture=True)
    assert lecture.dates[0]['day'] == '2026-09-18'
    unknown = parse_notice('<div class="v_news_content">报名截止10月10日</div>', 'AI大赛')
    assert unknown.dates == []
    mixed = parse_notice('<div class="v_news_content"><p>报名截止：2026年10月10日；联系人张三，电话13812345678</p></div>', 'AI大赛')
    assert [(part['kind'], part['day']) for part in mixed.dates] == [('报名', '2026-10-10')]
    assert '张三' not in mixed.excerpt
    links, _ = discover('<a href="/lecturenotice/6994.htm">Perovskite materials</a><a href="https://evil.test/info/1/2.htm">竞赛</a>', 'https://meeting.xjtu.edu.cn/')
    assert len(links) == 1


def test_fetch_respects_robots_redirects_and_backpressure():
    from app.services.campus_fetch import CampusFetcher, FetchBlocked
    async def check():
        requests = []
        def handler(req):
            requests.append(str(req.url))
            if req.url.path == '/robots.txt':
                return httpx.Response(200, text='User-agent: *\nDisallow: /private\n')
            if req.url.path == '/redirect':
                return httpx.Response(302, headers={'location': 'https://evil.test/'})
            return httpx.Response(429)
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            fetch = CampusFetcher(client, delay=0)
            for url in ['https://wljsxy.xjtu.edu.cn/private', 'https://wljsxy.xjtu.edu.cn/redirect', 'https://wljsxy.xjtu.edu.cn/rate']:
                with pytest.raises(FetchBlocked):
                    await fetch.html(url)
            assert not any('/private' in x or 'evil.test' in x for x in requests)
    asyncio.run(check())


@pytest.fixture()
def factory(tmp_path, monkeypatch):
    from app.config import reset_settings_cache
    from app.database import enable_sqlite_foreign_keys
    url = f"sqlite:///{(tmp_path / 'campus.db').as_posix()}"
    monkeypatch.setenv('DATABASE_URL', url)
    reset_settings_cache()
    root = Path(__file__).resolve().parents[1]
    cfg = Config(str(root / 'alembic.ini'))
    cfg.set_main_option('script_location', str(root / 'alembic'))
    command.upgrade(cfg, 'head')
    engine = enable_sqlite_foreign_keys(create_engine(url))
    assert {'campus_sources', 'campus_pages', 'campus_events', 'campus_notices'} <= set(inspect(engine).get_table_names())
    yield sessionmaker(engine, expire_on_commit=False, autoflush=False)
    engine.dispose()
    command.downgrade(cfg, '0023')
    engine = create_engine(url)
    assert 'campus_sources' not in inspect(engine).get_table_names()
    engine.dispose()
    reset_settings_cache()


def test_collection_dedup_updates_reminders_and_resume(factory):
    from app.campus_models import CampusSource, CampusEvent, CampusNotice
    from app.services.campus import CampusService
    now = datetime(2026, 9, 25, 0)
    state = {'deadline': '2026年9月28日'}
    def handler(req):
        if req.url.path == '/robots.txt': return httpx.Response(404)
        if req.url.path == '/':
            return httpx.Response(200, text='<a href="/info/1/1.htm">2026储能创新大赛</a>')
        return httpx.Response(200, text=f'<meta name="Article_PublishDate" content="2026-09-25"><div class="v_news_content">报名截止：{state["deadline"]}</div>')
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            service = CampusService(factory, client=client, delay=0, now=lambda: now)
            with factory() as db:
                for key, host in [('a', 'wljsxy'), ('b', 'mec')]:
                    db.add(CampusSource(key=key, name=key, group='学院', url=f'https://{host}.xjtu.edu.cn/', priority=100, enabled=True))
                db.commit()
            await service.run_due_once()
            with factory() as db:
                events = list(db.scalars(select(CampusEvent)))
                assert len(events) == 1
                event = events[0]
                assert len(list(db.scalars(select(CampusNotice)))) == 1
                event.followed = True
                db.commit()
            service.remind()
            service.remind()
            with factory() as db:
                assert len(list(db.scalars(select(CampusNotice)))) == 2
                for source in db.scalars(select(CampusSource)): source.next_check_at = now
                db.commit()
            state['deadline'] = '2026年9月30日'
            await service.run_due_once()
            with factory() as db:
                assert len(list(db.scalars(select(CampusEvent)))) == 1
                assert any(n.kind == 'changed' for n in db.scalars(select(CampusNotice)))
                for source in db.scalars(select(CampusSource)): source.enabled = False
                db.commit()
            assert await service.run_due_once() == 0
    asyncio.run(run())


def test_old_notice_no_new_alert_and_unknown_body_is_failure():
    from app.services.campus_parse import parse_notice, is_active
    item = parse_notice('<meta name="Article_PublishDate" content="2026-09-23"><div class="v_news_content">讲座时间：2026-09-18 15:30</div>', '讲座')
    assert not is_active(item.dates, item.published_on, date(2026, 9, 25))
    with pytest.raises(ValueError): parse_notice('<html><body>登录后访问</body></html>', '通知')


def test_realistic_registration_range_and_unknown_date_visibility():
    from app.services.campus_parse import is_active, parse_notice
    html = '''<div class="v_news_content"><p>（一）报名：即日起至2026年10月10日；</p>
    <p>（二）作品提交：截至2026年10月25日；</p></div>'''
    item = parse_notice(html, '西安交通大学AI创新大赛')
    assert [(part['kind'], part['day']) for part in item.dates] == [
        ('报名', '2026-10-10'), ('提交', '2026-10-25')]
    interval = parse_notice('''<div class="v_news_content"><p>报名时间：2026年9月20日至2026年10月10日</p></div>''', '报名通知')
    assert [(part['kind'], part['day']) for part in interval.dates] == [('报名', '2026-10-10')]
    assert is_active([], None, date(2026, 9, 25))
    future_school = parse_notice('''<div class="contt_tit"><h2>关于科研报名的通知</h2>
      <span>时间：2026-06-11 点击数： 来源：</span></div>
      <div class="v_news_content"><p>项目申请办法详见附件，2027年度开始。</p></div>
      <footer>更新时间：2026-09-25</footer>''', '关于科研报名的通知')
    assert future_school.published_on == date(2026, 6, 11)
    assert is_active(future_school.dates, future_school.published_on, date(2026, 9, 25))
    from app.services.campus_parse import is_recent_enough_to_alert
    assert not is_recent_enough_to_alert(future_school.dates, future_school.published_on, date(2026, 9, 25))
    mechanical = parse_notice('''<div class="arc-info"><span>发布日期：2026年09月22日 15:19</span></div>
      <div class="v_news_content"><p>报名截止：2026年10月10日</p></div>''', 'AI大赛')
    assert mechanical.published_on == date(2026, 9, 22)


def test_api_source_cooldown_and_actionable_notice(factory):
    from fastapi.testclient import TestClient
    from app.campus_models import CampusEvent, CampusNotice, CampusPage, CampusSource
    from app.main import create_app

    next_check = datetime(2026, 9, 26)
    with factory() as db:
        source = CampusSource(key='custom-test', name='未来技术学院', group='未来技术学院',
                              url='https://wljsxy.xjtu.edu.cn/', priority=100,
                              enabled=False, next_check_at=next_check)
        db.add(source)
        db.flush()
        event = CampusEvent(identity='active-test', title='科研讲座', category='讲座',
                            excerpt='明确活动时间', dates_json='[{"kind":"活动","day":"2099-01-01","evidence":"活动时间2099-01-01"}]',
                            published_on=None, priority=100, followed=False, conflict=False,
                            first_seen_at=datetime.utcnow(), updated_at=datetime.utcnow())
        db.add(event)
        db.flush()
        db.add(CampusPage(source_id=source.id, url='https://wljsxy.xjtu.edu.cn/info/1/1.htm',
                          title=event.title, event_id=event.id, fingerprint='a', dates_json=event.dates_json))
        db.add(CampusNotice(event_id=event.id, title=event.title, body='发现', kind='new',
                            dedupe_key='new-test', created_at=datetime.utcnow()))
        db.commit()
    app = create_app()
    app.state.session_factory = factory
    client = TestClient(app)
    assert client.get('/api/v1/campus/events').json()['total'] == 1
    notice = client.get('/api/v1/campus/notices').json()['items'][0]
    assert notice['url'] == 'https://wljsxy.xjtu.edu.cn/info/1/1.htm'
    assert notice['source_name'] == '未来技术学院'
    assert client.post(f"/api/v1/campus/notices/{notice['id']}/read").json()['read_at']
    assert client.post('/api/v1/campus/activate').status_code == 200
    assert client.post('/api/v1/campus/activate').status_code == 200
    with factory() as db:
        assert db.scalar(select(CampusSource).where(CampusSource.key == 'custom-test')).next_check_at == next_check
    assert client.patch(f"/api/v1/campus/sources/{source.id}", json={'enabled': False}).json()['status'] == 'paused'
    app.state.engine.dispose()


def test_second_list_rate_limit_stops_details(factory):
    from app.campus_models import CampusSource
    from app.services.campus import CampusService

    paths = []
    def handler(req):
        paths.append(req.url.path)
        if req.url.path == '/robots.txt':
            return httpx.Response(404)
        if req.url.path == '/next.htm':
            return httpx.Response(429)
        return httpx.Response(200, text='''<a href="/info/1/1.htm">科研大赛</a>
            <a href="/next.htm">下一页</a>''')

    async def run():
        with factory() as db:
            db.add(CampusSource(key='rate', name='测试', group='学院',
                                url='https://wljsxy.xjtu.edu.cn/', priority=100, enabled=True))
            db.commit()
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            service = CampusService(factory, client=client, delay=0, now=lambda: datetime(2026, 9, 25))
            await service.run_due_once()
        with factory() as db:
            source = db.scalar(select(CampusSource).where(CampusSource.key == 'rate'))
            assert source.status == 'blocked'
            assert source.next_check_at >= datetime(2026, 9, 26)
        assert '/info/1/1.htm' not in paths
    asyncio.run(run())


def test_restricted_article_does_not_block_public_pages_on_same_host(factory):
    from app.campus_models import CampusPage, CampusSource
    from app.services.campus import CampusService

    now = datetime(2026, 9, 25)
    paths = []
    def handler(req):
        paths.append(req.url.path)
        if req.url.path == '/robots.txt':
            return httpx.Response(404)
        if req.url.path == '/info/1/1.htm':
            return httpx.Response(403)
        if req.url.path == '/info/1/2.htm':
            return httpx.Response(200, text='<div class="v_news_content">报名截止：2026年10月10日</div>')
        if req.url.path == '/restricted/':
            return httpx.Response(200, text='<a href="/info/1/1.htm">受限文章</a><a href="/info/1/2.htm">公开文章</a>')
        return httpx.Response(200, text='<a href="/info/1/2.htm">公开文章</a>')

    async def run():
        with factory() as db:
            db.add_all([CampusSource(key='restricted', name='受限栏目', group='学院',
                                     url='https://wljsxy.xjtu.edu.cn/restricted/', priority=100, enabled=True),
                        CampusSource(key='public', name='公开栏目', group='学院',
                                     url='https://wljsxy.xjtu.edu.cn/public/', priority=90, enabled=True)])
            db.commit()
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            service = CampusService(factory, client=client, delay=0, now=lambda: now)
            await service.run_due_once()
            assert not service._blocked_hosts
        with factory() as db:
            rows = {row.key: row for row in db.scalars(select(CampusSource))}
            assert rows['restricted'].status == 'partial'
            assert rows['public'].status == 'ok'
            assert any(page.last_error == '访问受限（HTTP 403）' for page in db.scalars(select(CampusPage)))
        assert '/public/' in paths and '/info/1/2.htm' in paths
    asyncio.run(run())


def test_rate_limit_retry_after_blocks_same_host(factory):
    from app.campus_models import CampusSource
    from app.services.campus import CampusService

    now = datetime(2026, 9, 25)
    paths = []
    def handler(req):
        paths.append(req.url.path)
        if req.url.path == '/robots.txt':
            return httpx.Response(404)
        if req.url.path == '/rate/':
            return httpx.Response(429, headers={'Retry-After': '120'})
        return httpx.Response(200, text='<a href="/info/1/2.htm">公开文章</a>')

    async def run():
        with factory() as db:
            db.add_all([CampusSource(key='rate', name='限流栏目', group='学院',
                                     url='https://wljsxy.xjtu.edu.cn/rate/', priority=100, enabled=True),
                        CampusSource(key='other', name='同站栏目', group='学院',
                                     url='https://wljsxy.xjtu.edu.cn/other/', priority=90, enabled=True)])
            db.commit()
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            service = CampusService(factory, client=client, delay=0, now=lambda: now)
            await service.run_due_once()
        with factory() as db:
            rows = list(db.scalars(select(CampusSource)))
            assert all(row.status == 'blocked' and row.next_check_at == now + timedelta(seconds=120) for row in rows)
        assert '/other/' not in paths
    asyncio.run(run())


def test_repeated_list_links_with_production_autoflush_disabled(factory):
    from app.campus_models import CampusPage, CampusSource
    from app.services.campus import CampusService

    def handler(req):
        if req.url.path == '/robots.txt':
            return httpx.Response(404)
        if req.url.path == '/':
            return httpx.Response(200, text='''<a href="/tzgg.htm">通知公告</a>
                <a href="/info/1/1.htm">储能科研大赛</a><a href="/next.htm">下一页</a>''')
        if req.url.path == '/next.htm':
            return httpx.Response(200, text='''<a href="/tzgg.htm">通知公告</a>
                <a href="/info/1/1.htm">储能科研大赛</a>
                <a href="/info/1/2.htm">储能创新项目</a>''')
        return httpx.Response(200, text='''<meta name="Article_PublishDate" content="2026-09-25">
            <div class="v_news_content"><p>报名截止：2026年10月10日</p></div>''')

    async def run():
        with factory() as db:
            db.add(CampusSource(key='duplicate', name='测试', group='学院',
                                url='https://wljsxy.xjtu.edu.cn/', priority=100, enabled=True))
            db.commit()
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            service = CampusService(factory, client=client, delay=0, now=lambda: datetime(2026, 9, 25))
            assert await service.run_due_once() == 1
        with factory() as db:
            source = db.scalar(select(CampusSource).where(CampusSource.key == 'duplicate'))
            assert source.status == 'ok'
            assert len(list(db.scalars(select(CampusPage)))) == 2
            assert '发现 2 条链接' in source.detail
    asyncio.run(run())


def test_quality_feed_and_specific_categories():
    from app.services.campus import feed_status, _identity
    from app.services.campus_parse import classify

    today = date(2026, 9, 25)
    assert feed_status([], date(2018, 5, 4), today, False) == ('archive', 'published')
    assert feed_status([], date(2026, 9, 1), today, False) == ('recent', 'published')
    assert feed_status([], None, today, False) == ('unknown', 'unknown')
    future = [{'kind': '报名', 'day': '2026-10-10', 'evidence': '报名截止2026年10月10日'}]
    assert feed_status(future, date(2018, 5, 4), today, False) == ('recent', 'future_date')
    assert feed_status(future, None, today, True) == ('unknown', 'conflict')
    assert classify('2026年保研推免工作通知').category == '学业升学'
    assert classify('未来技术学院2027年招收推荐免试研究生工作实施细则').subtype == '保研推免'
    assert classify('2027年电赛招募通知').subtype == '工程设计'
    assert classify('2027年电赛招募通知').category == '竞赛创新'
    assert classify('关于举办大学生电子设计竞赛的通知').subtype == '工程设计'
    assert classify('电子设计报名办班通知').category is None
    assert classify('关于近期事项的通知').subtype is None
    assert classify('关于举办数学建模竞赛的通知').subtype == '数学建模'
    assert classify('前沿材料研究学术成果发布').subtype == '学术成果'
    assert classify('书院趣味运动会报名').subtype == '趣味活动'
    assert _identity('22 2026.09 西安交通大学AI大赛', [], date(2026, 9, 22), 'https://mec.xjtu.edu.cn/info/1/2.htm') == \
           _identity('09.22 2026 西安交通大学AI大赛', [], date(2026, 9, 22), 'https://mec.xjtu.edu.cn/info/1/2.htm')


def test_existing_campus_event_uses_current_rule_without_reharvest(factory):
    from app.campus_models import CampusEvent
    from app.routers.campus import _event

    with factory() as db:
        row = CampusEvent(identity='older-electric-contest', title='2027年电赛招募通知', category='',
                          excerpt='', dates_json='[]', published_on=None, priority=90,
                          followed=False, conflict=False, analysis_json='{"status":"pending"}',
                          first_seen_at=datetime(2026, 9, 25), updated_at=datetime(2026, 9, 25))
        db.add(row)
        db.commit()
        item = _event(db, row, date(2026, 9, 27), 90)
        assert (item.category, item.subtype) == ('竞赛创新', '工程设计')
        assert (item.category_basis, item.subtype_basis) == ('rule', 'rule')
        assert item.analysis.status == 'pending'


def test_quality_api_scopes_keep_unknown_and_historical_separate(factory):
    from fastapi.testclient import TestClient
    from app.campus_models import CampusEvent
    from app.main import create_app

    with factory() as db:
        for key, published in [('old', date(2018, 5, 4)), ('new', date(2026, 9, 23)), ('unknown', None)]:
            db.add(CampusEvent(identity=key, title=key, category='其他', excerpt='', dates_json='[]',
                               published_on=published, priority=99, followed=False, conflict=False,
                               first_seen_at=datetime(2026, 9, 25), updated_at=datetime(2026, 9, 25)))
        db.commit()
    app = create_app()
    app.state.session_factory = factory
    client = TestClient(app)
    expected = {'recent': 'new', 'unknown': 'unknown', 'archive': 'old'}
    for scope, title in expected.items():
        response = client.get('/api/v1/campus/events', params={'scope': scope, 'days': 90})
        assert response.status_code == 200
        payload = response.json()
        assert payload['total'] == 1
        assert payload['items'][0]['title'] == title
        assert payload['items'][0]['feed_status'] == scope
        assert payload['counts'] == {'recent': 1, 'unknown': 1, 'archive': 1}
    app.state.engine.dispose()


def test_oa_public_list_and_trusted_detail_header():
    from app.services.campus_parse import discover, parse_notice
    listing = '''<table><tr><td><a class="noa_list" href="#" onclick="gotodetail('SPZQWWZ')"
      title="关于AI大赛升级的通知">关于AI大赛升级的通知</a></td>
      <td>网络信息中心（2026-09-22）</td></tr></table>'''
    links, _ = discover(listing, 'https://oa.xjtu.edu.cn/zxgg_index.jsp')
    assert [(link.url, link.published_on) for link in links] == [
        ('https://oa.xjtu.edu.cn/zxgg_infonew.jsp?processInsId=SPZQWWZ', date(2026, 9, 22))]
    article = '''<table class="nos_d"><tr><td><span class="noa_title">关于AI大赛升级的通知</span>
      <span class="noa_f">网络信息中心 发布于2026-09-22 10:14</span></td></tr>
      <tr><td><p>报名截止：2026年10月10日</p><p>联系人张三，电话13812345678</p></td></tr></table>'''
    parsed = parse_notice(article, '列表旧标题')
    assert parsed.title == '关于AI大赛升级的通知'
    assert parsed.published_on == date(2026, 9, 22)
    assert parsed.publication_evidence.startswith('发布于')
    assert parsed.dates[0]['day'] == '2026-10-10'
    assert '张三' not in parsed.model_text


def test_restricted_source_keeps_user_enabled_intent(factory):
    from app.campus_models import CampusSource
    from app.services.campus import CampusService
    with factory() as db:
        db.add(CampusSource(key='restricted-test', name='受限栏目', group='学院',
                            url='https://wljsxy.xjtu.edu.cn/', priority=100, enabled=True))
        db.commit()
    def handler(req):
        if req.url.path == '/robots.txt':
            return httpx.Response(404)
        return httpx.Response(302, headers={'location': '/system/resource/code/auth/clogin.jsp'})
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            service = CampusService(factory, client=client, delay=0, now=lambda: datetime(2026, 9, 25))
            await service.run_due_once()
    asyncio.run(run())
    with factory() as db:
        source = db.scalar(select(CampusSource).where(CampusSource.key == 'restricted-test'))
        assert source.enabled is True
        assert source.status == 'blocked'
        assert source.access_state == 'login_required'
def test_news_date_anchors_are_not_titles_and_news_header_is_parsed():
    from datetime import date
    from app.services.campus_parse import discover, parse_notice
    links, _ = discover('<a href="info/1004/123.htm">24</a><a href="info/1004/123.htm">2026-09</a>'
                        '<a href="info/1004/123.htm">团队在锂金属电池领域取得进展</a>',
                        'https://news.xjtu.edu.cn/')
    assert len(links) == 1
    assert links[0].title == '团队在锂金属电池领域取得进展'
    parsed = parse_notice('<div class="con-tit"><h1></h1><h1>栏目副标题</h1><h1 class="ssd">团队在锂金属电池领域取得进展</h1>'
                          '<span>日期：2026-09-24 10:43</span></div>'
                          '<div class="v_news_content"><p>研究团队通过实验取得锂电池科研进展。</p></div>', '2026-09')
    assert parsed.title == '团队在锂金属电池领域取得进展'
    assert parsed.published_on == date(2026, 9, 24)
