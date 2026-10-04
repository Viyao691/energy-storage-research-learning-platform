"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";
import GlideSelect from "../../components/react-bits/GlideSelect";
import SettingsModelPicker from "../../components/workspace/SettingsModelPicker";
import TitleMotion from "../../components/workspace/TitleMotion";

import Link from "next/link";
import React, { useState } from "react";

import { api } from "../../lib/api";
import { MODEL_PROVIDERS, modelChoices, providerChoice } from "../../lib/modelCatalog";
import {
  applyProviderPreset,
  providerNeedsApiKey,
  SettingsFormValues
} from "../../lib/presentation";
import "../../components/workspace/discovery-refinement.css";
import "../../components/workspace/onboarding-atmosphere.css";

const titles = [
  "选择使用模式",
  "配置模型",
  "测试模型",
  "设置研究方向",
  "设置论文关键词",
  "设置每日报告时间",
  "设置预算"
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [studyMode, setStudyMode] = useState("学习导师");
  const [modelProvider, setModelProvider] = useState("mock");
  const [modelName, setModelName] = useState(providerChoice("mock")?.defaultModel || "");
  const [visionModel, setVisionModel] = useState("");
  const [modelBaseUrl, setModelBaseUrl] = useState("");
  const [backupModel, setBackupModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [topics, setTopics] = useState("钠离子电池；层状氧化物");
  const [keywords, setKeywords] = useState("P2；O3；阴离子氧化还原");
  const [dailyTaskTime, setDailyTaskTime] = useState("08:30");
  const [dailyBudget, setDailyBudget] = useState("0");
  const [monthlyBudget, setMonthlyBudget] = useState("0");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const split = (value: string) =>
    value.split(/[；;，,]/).map((item) => item.trim()).filter(Boolean);

  function chooseProvider(provider: string) {
    const current: SettingsFormValues = {
      model_provider: modelProvider,
      model_name: modelName,
      vision_model: visionModel,
      model_base_url: modelBaseUrl,
      api_key: apiKey,
      timeout_seconds: "60",
      backup_model: backupModel,
      paper_budget: "0",
      daily_budget: dailyBudget,
      monthly_budget: monthlyBudget
    };
    const next = applyProviderPreset(current, provider);
    setModelProvider(next.model_provider);
    setModelName(next.model_name);
    setVisionModel(next.vision_model);
    setModelBaseUrl(next.model_base_url);
    setBackupModel(next.backup_model);
    setApiKey(next.api_key);
  }

  async function next() {
    if (step === 1) {
      setBusy(true);
      try {
        await api.saveSettings({
          model_provider: modelProvider,
          model_name: modelName,
          vision_model: visionModel,
          model_base_url: modelBaseUrl,
          ...(providerNeedsApiKey(modelProvider) && apiKey.trim()
            ? { api_key: apiKey.trim() }
            : {}),
          timeout_seconds: 60,
          backup_model: backupModel,
          paper_budget: 0,
          daily_budget: Number(dailyBudget),
          monthly_budget: Number(monthlyBudget)
        });
        setApiKey("");
        setMessage("模型设置已保存。下一步可测试连接。");
        setStep(2);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "保存模型设置失败");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 2) {
      setBusy(true);
      try {
        const result = await api.testModel();
        setMessage(result.message || "模型测试完成。");
        setStep(3);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "模型测试失败");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step < titles.length - 1) setStep(step + 1);
    else await finish();
  }

  async function finish() {
    setBusy(true);
    try {
      await api.completeOnboarding({
        study_mode: studyMode,
        research_topics: split(topics),
        keywords: split(keywords),
        daily_task_time: dailyTaskTime,
        daily_budget: Number(dailyBudget),
        monthly_budget: Number(monthlyBudget)
      });
      setMessage("初始化完成。现在可以开始上传论文。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "初始化失败");
    } finally {
      setBusy(false);
    }
  }

  const body = [
    <>
      <p>选择你的主要使用方向。当前仅记录偏好，各模式均可使用全部功能，不会自动改变 AI 回答风格。</p>
      <label htmlFor="onboarding-study-mode">当前主要使用模式</label>
      <GlideSelect id="onboarding-study-mode" value={studyMode} onChange={setStudyMode} options={[{ value: "学习导师", label: "学习导师" }, { value: "科研助手", label: "科研助手" }, { value: "竞赛助手", label: "竞赛助手" }]} />
    </>,
    <>
      <p>没有云端密钥时，可选择 Mock 演示或 Ollama 本地文本与图像模型。</p>
      <label htmlFor="onboarding-model-provider">模型供应商</label>
      <GlideSelect id="onboarding-model-provider" value={modelProvider} onChange={chooseProvider} menuLayout="grid" options={MODEL_PROVIDERS.map(({ value, label }) => ({ value, label }))} />
      <label htmlFor="onboarding-model-name">模型名称</label>
      <SettingsModelPicker key={modelProvider} id="onboarding-model-name" value={modelName} options={modelChoices(modelProvider)} onChange={setModelName} placeholder="输入供应商提供的模型 ID" />
      {modelProvider === "ollama" && (
        <>
          <label htmlFor="onboarding-vision-model">视觉模型</label>
          <SettingsModelPicker id="onboarding-vision-model" value={visionModel} options={modelChoices("ollama", true)} onChange={setVisionModel} placeholder="输入本机视觉模型 ID" />
        </>
      )}
      <label>API 基础地址</label>
      <input
        value={modelBaseUrl}
        onChange={(event) => setModelBaseUrl(event.target.value)}
        placeholder={modelProvider === "ollama" ? "http://host.docker.internal:11434" : "模型服务地址"}
      />
      {modelProvider === "ollama" && (
        <p className="muted">Ollama 无需 API 密钥。图片识别需运行 ollama pull qwen2.5vl:3b（约 3.2 GB）。</p>
      )}
      {providerNeedsApiKey(modelProvider) && (
        <>
          <label>API 密钥（可选）</label>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="new-password"
            placeholder="仅在保存时发送给后端一次"
          />
        </>
      )}
    </>,
    <p>上一步已保存当前供应商和模型。点击下方按钮，由后端测试当前模型连接；浏览器不会读取密钥。</p>,
    <>
      <label>研究方向（用分号分隔）</label>
      <textarea value={topics} onChange={(event) => setTopics(event.target.value)} />
    </>,
    <>
      <label>关注关键词（用分号分隔）</label>
      <textarea value={keywords} onChange={(event) => setKeywords(event.target.value)} />
    </>,
    <>
      <label>每日报告时间</label>
      <input type="time" value={dailyTaskTime} onChange={(event) => setDailyTaskTime(event.target.value)} />
    </>,
    <>
      <label>每日预算</label>
      <input type="number" step="0.01" value={dailyBudget} onChange={(event) => setDailyBudget(event.target.value)} />
      <label>每月预算</label>
      <input type="number" step="0.01" value={monthlyBudget} onChange={(event) => setMonthlyBudget(event.target.value)} />
      <p className="muted">Mock 和 Ollama 不产生模型 API 费用。</p>
    </>
  ][step];

  return (
    <section className="editorial-page onboarding-page onboarding-refined">
      <div className="onboarding-intro">
        <div>
          <p className="discovery-kicker">WORKSPACE SETUP</p>
          <h1><TitleMotion text="首次设置向导" variant="warp" /></h1>
          <p className="lead">第 {step + 1} 步：{titles[step]}</p>
        </div>
        <div className="onboarding-campus-gate" aria-hidden="true" />
      </div>
      <div className="steps">
        {titles.map((title, index) => (
          <span key={index} className={`step ${index <= step ? "on" : ""}`} aria-label={`${index + 1}. ${title}`} title={`${index + 1}. ${title}`} />
        ))}
      </div>
      <div className="card onboarding-step-card">
        {body}
        {busy && <LatticeLoader label={step === 1 ? "正在保存模型设置…" : step === 2 ? "正在测试模型连接…" : "正在完成初始化…"} showTimer />}
        {message && <p className={message.includes("失败") ? "error" : "success"}>{message}</p>}
        <div className="row" style={{ marginTop: 18 }}>
          {step > 0 && <button className="secondary" onClick={() => setStep(step - 1)}>上一步</button>}
          <button onClick={next} disabled={busy}>
            {busy ? "处理中…" : step === titles.length - 1 ? "完成初始化" : step === 1 ? "保存模型设置" : step === 2 ? "测试模型连接" : "下一步"}
          </button>
          {message.includes("初始化完成") && <Link className="button" href="/dashboard">进入工作台</Link>}
        </div>
      </div>
    </section>
  );
}
