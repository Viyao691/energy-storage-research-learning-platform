from test_knowledge_api import client, _upload


def test_note_draft_uses_database_evidence_and_does_not_save(client):
    paper = _upload(client)
    client.post("/api/v1/knowledge/reindex")
    answer = client.post(f"/api/v1/papers/{paper['id']}/knowledge/ask",
                         json={"question": "What causes degradation?"}).json()
    citation = answer["citations"][0]
    citation["paper_title"] = "FORGED TITLE"
    citation["excerpt"] = "FORGED EXCERPT"
    response = client.post(f"/api/v1/papers/{paper['id']}/note-draft", json={
        "question": answer["question"], "answer_markdown": answer["answer_markdown"],
        "citations": [citation],
    })
    assert response.status_code == 200
    assert "FORGED" not in response.json()["markdown"]
    assert "Slab gliding" in response.json()["markdown"]
    assert client.get(f"/api/v1/papers/{paper['id']}").json()["note"] == ""
    citation["evidence_key"] = "stale"
    assert client.post(f"/api/v1/papers/{paper['id']}/note-draft", json={
        "question": "question", "answer_markdown": "answer", "citations": [citation],
    }).status_code == 409


def test_challenge_has_three_questions_and_preserves_fulltext_on_note_save(client):
    paper = _upload(client)
    path = f"/api/v1/papers/{paper['id']}"
    assert client.get(path + "/research-challenge").status_code == 409
    client.post("/api/v1/knowledge/reindex")
    challenge = client.get(path + "/research-challenge")
    assert challenge.status_code == 200
    assert len(challenge.json()["questions"]) == 3
    assert all(c["source_scope"] != "note" for c in challenge.json()["citations"])
    from app.models import PaperChunk
    from sqlalchemy import select
    with client.app.state.session_factory() as db:
        before = [(c.id, c.content, c.source_locations_json) for c in db.scalars(select(PaperChunk))]
    assert client.put(path + "/note", json={"content": "My research challenge"}).status_code == 200
    with client.app.state.session_factory() as db:
        after = [(c.id, c.content, c.source_locations_json) for c in db.scalars(select(PaperChunk))]
    assert before == after
    assert client.get("/api/v1/knowledge/status").json()["stale_papers"] == 1
    assert client.post("/api/v1/knowledge/reindex").status_code == 200
    assert client.get("/api/v1/knowledge/status").json()["stale_papers"] == 0


def test_reindex_preserves_active_parse_text_and_version(client):
    from app.models import Paper, PaperParseRun, PaperPageExtraction, PaperChunk
    from sqlalchemy import select
    paper = _upload(client)
    with client.app.state.session_factory() as db:
        run = PaperParseRun(paper_id=paper["id"], version_number=1, mode="candidate",
                            status="completed", engine="docling")
        db.add(run)
        db.flush()
        run_id = run.id
        db.add(PaperPageExtraction(paper_id=paper["id"], parse_run_id=run.id,
                                  page_number=1, source_type="docling",
                                  text="Active Docling result with verified table content."))
        db.get(Paper, paper["id"]).active_parse_run_id = run.id
        db.commit()
    assert client.post("/api/v1/knowledge/reindex").status_code == 200
    with client.app.state.session_factory() as db:
        chunks = list(db.scalars(select(PaperChunk)))
        assert len(chunks) == 1
        assert "Active Docling result" in chunks[0].content
        assert chunks[0].parse_run_id == run_id


def test_empty_or_foreign_citations_rejected(client):
    paper = _upload(client)
    client.post("/api/v1/knowledge/reindex")
    data = client.get(f"/api/v1/papers/{paper['id']}/research-challenge").json()
    payload = {"question": "question", "answer_markdown": "answer", "citations": []}
    path = f"/api/v1/papers/{paper['id']}/note-draft"
    assert client.post(path, json=payload).status_code == 422
    payload["citations"] = data["citations"]
    payload["citations"][0]["paper_id"] = 999
    assert client.post(path, json=payload).status_code == 409
