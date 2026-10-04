"use client";

import Link from "next/link";
import React, { FormEvent, useRef, useState } from "react";
import { api, Paper } from "../../lib/api";
import { MAX_PDF_UPLOAD_MB, validatePdfUpload } from "../../lib/uploadLimits";
import { reservePaperArtwork } from "../../lib/paperArtwork";
import LatticeLoader from "../../components/react-bits/LatticeLoader";
import Magnet from "../../components/react-bits/Magnet";
import MaterialHero from "../../components/workspace/MaterialHero";
import TitleMotion from "../../components/workspace/TitleMotion";
import "../../components/workspace/material-pages.css";

function fileSize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<Paper>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [dragging, setDragging] = useState(false);

  function choose(selected?: File) {
    if (busy) return;
    const validationError = validatePdfUpload(selected);
    setResult(undefined);
    setAttempted(false);
    if (validationError) {
      setFile(undefined);
      setError(validationError);
      if (input.current) input.current.value = "";
      return;
    }
    setFile(selected);
    setError("");
  }

  function reset() {
    if (busy) return;
    setFile(undefined);
    setResult(undefined);
    setError("");
    setAttempted(false);
    if (input.current) input.current.value = "";
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const validationError = validatePdfUpload(file);
    if (validationError) { setError(validationError); return; }
    setBusy(true);
    setAttempted(true);
    setError("");
    setResult(undefined);
    try {
      const uploaded = await api.upload(file!);
      reservePaperArtwork(String(uploaded.id));
      setResult(uploaded);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "上传失败");
    } finally { setBusy(false); }
  }

  return (
    <section className="upload-workspace material-upload-page">
      <div className="material-upload-stage">
        <MaterialHero kind="upload" dragging={dragging} />
        <div className="material-upload-copy">
          <p className="material-upload-eyebrow">上传论文 / 本地研究库</p>
          <h1><TitleMotion text={"让每一篇论文，\n进入你的研究脉络。"} variant="warp" warpLineHeight="1.5em" /></h1>
          <p>选择或拖入合法取得的 PDF，建立可追溯的本地阅读路径。</p>
        </div>
        <div className="material-upload-card">
          <form onSubmit={submit}>
            <div data-testid="pdf-dropzone" className={`material-dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
              onDragEnter={event => { event.preventDefault(); if (!busy) setDragging(true); }}
              onDragOver={event => { event.preventDefault(); }}
              onDragLeave={event => { event.preventDefault(); setDragging(false); }}
              onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) choose(event.dataTransfer.files[0]); }}>
              <strong>{file ? file.name : "上传 PDF"}</strong>
              <p>{busy ? "正在上传和解析，请稍候" : result ? "已加入论文库" : file ? `${fileSize(file.size)} · 准备上传` : `拖入文件或点击选择 · 最大 ${MAX_PDF_UPLOAD_MB}MB`}</p>
              <input ref={input} id="file" aria-label="选择 PDF" type="file" accept="application/pdf,.pdf" disabled={busy}
                onChange={event => choose(event.target.files?.[0])} />
              <label className="material-file-select" htmlFor="file" aria-disabled={busy}>选择 PDF <span aria-hidden="true">↗</span></label>
            </div>
            <div className="material-upload-actions">
              {(file || result) && <button className="material-reset" type="button" disabled={busy} onClick={reset}>重新选择</button>}
              <Magnet wrapperClassName="material-submit-wrap" disabled={busy || !file}><button type="submit" disabled={busy || !file}>上传并解析 <span aria-hidden="true">↗</span></button></Magnet>
            </div>
            {attempted && <LatticeLoader status={busy ? "working" : error ? "error" : "done"} label="正在上传和解析" doneLabel="已加入论文库" errorLabel="上传未完成" showTimer />}
            {error && <p className="material-upload-error" role="alert">{error}</p>}
            {result && <p className="material-upload-success" role="status">已加入论文库：<Link href={`/papers/${result.id}`}>{result.title}</Link></p>}
          </form>
        </div>
        <p className="material-upload-footnote">上传前请确认拥有该文件的使用权。重复文件会由本地库识别；解析质量请在论文详情中核对。</p>
      </div>
    </section>
  );
}
