"use client";

import LatticeLoader from "../../../components/react-bits/LatticeLoader";
import TitleMotion from "../../../components/workspace/TitleMotion";

import React from "react";
import { ConfirmDeleteButton } from "../../../components/ConfirmDeleteButton";
import {
  AnalysisTabs,
} from "../../../components/papers/AnalysisTabs";
import {
  ClaimsPanel,
} from "../../../components/papers/ClaimsPanel";
import { GlossaryPanel } from "../../../components/papers/GlossaryPanel";
import {
  NotePanel,
} from "../../../components/papers/NotePanel";
import {
  PaperFollowUp,
} from "../../../components/papers/PaperFollowUp";
import {
  PdfWorkspace,
} from "../../../components/papers/PdfWorkspace";
import {
  ScientificPanel,
} from "../../../components/papers/ScientificPanel";
import {
  usePaperDetail,
} from "../../../components/papers/usePaperDetail";
import {
  VisualPanel,
} from "../../../components/papers/VisualPanel";
import "../../../components/papers/reader-refinement.css";

export default function PaperDetail() {
  const detail = usePaperDetail();
  const {
    id,
    router,
    paper,
    note,
    setNote,
    claims,
    claimsBusy,
    currentPage,
    setCurrentPage,
    message,
    busy,
    activeTab,
    hasLocalPdf,
    authors,
    boundedCurrentPage,
    selectedVisual,
    startOcr,
    enhanceCurrentPage,
    createScientificDraft,
    saveScientificDataset,
    runScientificRecipe,
    analyzeCurrentReport,
    save,
    analyzeSelectedVisual,
    rebuildClaims,
    askPaper,
    savePaperConversation,
    compareWithExternalSources,
    cropPoint,
    updateCropSelection,
    saveCrop,
    analyzeCrop,
    extractCropData,
    deleteCrop,
  } = detail;

  if (!paper) return message ? <p>{message}</p> : <LatticeLoader label="正在加载论文…" showTimer />;

  return (
    <section className="reader-workspace reader-refined">
      <div className="toolbar reader-paper-header">
        <div>
          <span className="reader-eyebrow">RESEARCH DOCUMENT / 论文研读</span>
          <h1><TitleMotion text={paper.title} variant="focus" /></h1>
          <p className="lead">
            {authors || "作者信息待提取"} · {hasLocalPdf ? `${paper.page_count ?? "?"} 页全文 PDF` : paper.abstract ? "仅摘要" : "仅元数据"} ·
            解析置信度 {paper.parse_confidence ?? "—"}
          </p>
        </div>
        <ConfirmDeleteButton
          paperId={paper.id}
          paperTitle={paper.title}
          onDeleted={() => router.push("/library")}
        />
      </div>
      {message && (
        <p
          className={
            message.includes("失败") || message.includes("配置")
              ? "error"
              : "success"
          }
        >
          {message}
        </p>
      )}
      {busy && <LatticeLoader label="正在处理论文操作…" showTimer />}
      <div className="detail-grid">
        <PdfWorkspace
          id={id}
          paper={paper}
          hasLocalPdf={hasLocalPdf}
          pdfVariant={detail.pdfVariant}
          setPdfVariant={detail.setPdfVariant}
          currentPage={currentPage}
          boundedCurrentPage={boundedCurrentPage}
          setCurrentPage={setCurrentPage}
          ocrRuns={detail.ocrRuns}
          ocrBusy={detail.ocrBusy}
          startOcr={startOcr}
          enhanceCurrentPage={enhanceCurrentPage}
          visuals={detail.visuals}
          visualMessage={detail.visualMessage}
          selectedVisualId={detail.selectedVisualId}
          setSelectedVisualId={detail.setSelectedVisualId}
          parserStatus={detail.parserStatus}
          parseCandidates={detail.parseCandidates}
          parseComparison={detail.parseComparison}
          parseCandidateBusy={detail.parseCandidateBusy}
          startParseCandidate={detail.startParseCandidate}
          compareParseCandidate={detail.compareParseCandidate}
          activateParseCandidate={detail.activateParseCandidate}
          cancelParseCandidate={detail.cancelParseCandidate}
          selectedEvidence={detail.selectedEvidence}
          evidenceMessage={detail.evidenceMessage}
        />
        <div className="card analysis-panel">
          <div className="analysis-scroll">
          <div className="reader-section-heading"><span>02 / RESEARCH REPORT</span><h2>研读报告</h2></div>
          <AnalysisTabs
            activeTab={activeTab}
            setActiveTab={detail.setActiveTab}
            analysis={detail.analysis}
            busy={busy}
            analyzeCurrentReport={analyzeCurrentReport}
          >
            {activeTab === "glossary" && <GlossaryPanel
              glossary={detail.glossary}
              answers={detail.glossaryAnswers}
              question={detail.glossaryQuestion}
              setQuestion={detail.setGlossaryQuestion}
              generating={detail.glossaryBusy}
              asking={detail.glossaryAskBusy}
              error={detail.glossaryError}
              generate={detail.generateGlossary}
              ask={detail.askGlossary}
              stop={detail.stopGlossaryAsk}
            />}
            {activeTab === "claims" && (
              <ClaimsPanel
                claims={claims}
                claimsBusy={claimsBusy}
                claimsFeedback={detail.claimsFeedback}
                claimsError={detail.claimsError}
                rebuildClaims={rebuildClaims}
                selectEvidence={detail.selectEvidence}
              />
            )}
            {activeTab === "visual" && (
              <VisualPanel
                id={id}
                selectedVisual={selectedVisual}
                visualMessage={detail.visualMessage}
                visualBusy={detail.visualBusy}
                cropStart={detail.cropStart}
                setCropStart={detail.setCropStart}
                cropSelection={detail.cropSelection}
                setCropSelection={detail.setCropSelection}
                crops={detail.crops}
                formulas={detail.formulas}
                transcribeFormula={detail.transcribeFormula}
                appendFormula={detail.appendFormula}
                cropPoint={cropPoint}
                updateCropSelection={updateCropSelection}
                saveCrop={() => saveCrop(selectedVisual)}
                analyzeCrop={analyzeCrop}
                extractCropData={extractCropData}
                deleteCrop={(cropId) => deleteCrop(cropId, selectedVisual)}
                analyzeSelectedVisual={analyzeSelectedVisual}
              />
            )}
            {activeTab === "scientific" && (
              <ScientificPanel
                id={id}
                selectedVisual={selectedVisual}
                scientificDatasets={detail.scientificDatasets}
                scientificRecipes={detail.scientificRecipes}
                selectedDatasetId={detail.selectedDatasetId}
                setSelectedDatasetId={detail.setSelectedDatasetId}
                scientificData={detail.scientificData}
                setScientificData={detail.setScientificData}
                scientificUnits={detail.scientificUnits}
                setScientificUnits={detail.setScientificUnits}
                scientificParameters={detail.scientificParameters}
                setScientificParameters={detail.setScientificParameters}
                scientificRecipe={detail.scientificRecipe}
                setScientificRecipe={detail.setScientificRecipe}
                scientificResult={detail.scientificResult}
                scientificBusy={detail.scientificBusy}
                scientificMessage={detail.scientificMessage}
                createScientificDraft={() => createScientificDraft(selectedVisual, detail.crops)}
                saveScientificDataset={saveScientificDataset}
                runScientificRecipe={runScientificRecipe}
              />
            )}
            {activeTab === "note" && (
              <NotePanel
                note={note}
                setNote={setNote}
                save={save}
                busy={busy}
              />
            )}
          </AnalysisTabs>
          <PaperFollowUp
            showResearchTools={activeTab !== "glossary"}
            paperAnswers={detail.paperAnswers}
            paperQuestion={detail.paperQuestion}
            setPaperQuestion={detail.setPaperQuestion}
            paperQuestionBusy={detail.paperQuestionBusy}
            paperQuestionStatus={detail.paperQuestionStatus}
            paperQuestionError={detail.paperQuestionError}
            paperQuestionElapsedMs={detail.paperQuestionElapsedMs}
            paperQuestionStartedAt={detail.paperQuestionStartedAt}
            paperConversationSaveBusy={detail.paperConversationSaveBusy}
            askPaper={askPaper}
            savePaperConversation={savePaperConversation}
            appendNoteDraft={detail.appendNoteDraft}
            draftBusy={detail.draftBusy}
            challenge={detail.challenge}
            challengeAnswers={detail.challengeAnswers}
            setChallengeAnswers={detail.setChallengeAnswers}
            openChallenge={detail.openChallenge}
            externalQuestion={detail.externalQuestion}
            setExternalQuestion={detail.setExternalQuestion}
            externalBusy={detail.externalBusy}
            externalComparison={detail.externalComparison}
            compareWithExternalSources={compareWithExternalSources}
            selectEvidence={detail.selectEvidence}
          />
          </div>
        </div>
      </div>
    </section>
  );
}
