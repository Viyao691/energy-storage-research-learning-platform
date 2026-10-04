// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Hero from "../components/home-hero/Hero";

vi.mock("../components/home-hero/Particles", async () => {
 const React = await import("react");
 return { default: ({ theme }: { theme: string }) => React.createElement("div", { className: "hi-photo-particles", "data-testid": "particles", "data-theme": theme }) };
});

describe("photographic category homepage", () => {
 beforeEach(() => { vi.stubGlobal("React", React); });
 afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

 it("shows six representative cards and six Dock categories", () => {
  render(<Hero theme="light" onTheme={vi.fn()} papers={33} subscriptions={2} model="Ollama · qwen2.5:7b" unread={3}/>);
  const cards = within(screen.getByRole("navigation", { name: "科研工作入口" })).getAllByRole("link");
  expect(cards.map(link => link.getAttribute("href"))).toEqual(["/library", "/knowledge", "/learning", "/contests", "/research/chronicle", "/research/city-applications"]);
  const dock = screen.getByRole("navigation", { name: "研究工作台导航" });
  expect(within(dock).getByRole("link", { name: /首页/ }).getAttribute("href")).toBe("/dashboard");
  expect(within(dock).getAllByRole("button")).toHaveLength(5);
  for (const label of ["论文", "学习", "竞赛", "科研", "系统"]) expect(within(dock).getByRole("button", { name: `展开${label}分类` })).toBeTruthy();
  expect(document.querySelector(".hi-photo-scene")?.getAttribute("src")).toBe("/home-hero/scene-light.webp");
  expect(screen.getByTestId("particles").getAttribute("data-theme")).toBe("light");
 });

 it("opens the shared sidebar routes one category at a time and closes on Escape or outside click", () => {
  render(<Hero theme="light" onTheme={vi.fn()} papers={33} subscriptions={2} model="Ollama · qwen2.5:7b" unread={3}/>);
  const paperButton = screen.getByRole("button", { name: "展开论文分类" });
  fireEvent.click(paperButton);
  const paperMenu = screen.getByRole("group", { name: "论文分类菜单" });
  expect(within(paperMenu).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/upload", "/search", "/library", "/compare", "/knowledge"]);
  expect(within(paperMenu).getByText("33 篇本地论文")).toBeTruthy();
  expect(paperButton.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "展开学习分类" }));
  expect(screen.queryByRole("group", { name: "论文分类菜单" })).toBeNull();
  expect(within(screen.getByRole("group", { name: "学习分类菜单" })).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/learning", "/research-daily", "/campus"]);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("group", { name: "学习分类菜单" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "展开系统分类" }));
  const systemMenu = screen.getByRole("group", { name: "系统分类菜单" });
  expect(within(systemMenu).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/settings", "/diagnostics", "/maintenance", "/help", "/onboarding"]);
  expect(within(systemMenu).getByText("Ollama · qwen2.5:7b")).toBeTruthy();
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("group", { name: "系统分类菜单" })).toBeNull();
 });

 it("glides the warm highlight between hovered and keyboard-focused links", () => {
  render(<Hero theme="light" onTheme={vi.fn()}/>);
  fireEvent.click(screen.getByRole("button", { name: "展开论文分类" }));
  const menu = screen.getByRole("group", { name: "论文分类菜单" });
  const links = within(menu).getAllByRole("link");
  Object.defineProperty(links[0], "offsetTop", { value: 4 });
  Object.defineProperty(links[0], "offsetHeight", { value: 48 });
  Object.defineProperty(links[1], "offsetTop", { value: 52 });
  Object.defineProperty(links[1], "offsetHeight", { value: 48 });
  fireEvent.pointerEnter(links[0]);
  const pill = menu.querySelector(".hi-photo-dock-pill") as HTMLElement;
  expect(links[0].hasAttribute("data-active")).toBe(true);
  expect(pill.style.transform).toBe("translateY(4px)");
  fireEvent.focus(links[1]);
  expect(links[1].hasAttribute("data-active")).toBe(true);
  expect(links[0].hasAttribute("data-active")).toBe(false);
  expect(pill.style.transform).toBe("translateY(52px)");
 });

 it("keeps theme switching and card hover or focus feedback", () => {
  const onTheme = vi.fn();
  const { rerender } = render(<Hero theme="light" onTheme={onTheme}/>);
  const qa = document.querySelector('[data-feature="qa"].hi-photo-feature') as HTMLElement;
  const learning = document.querySelector('[data-feature="learning"].hi-photo-feature') as HTMLElement;
  fireEvent.pointerEnter(qa);
  expect(qa.classList.contains("is-active")).toBe(true);
  expect(learning.classList.contains("is-active")).toBe(false);
  fireEvent.pointerLeave(qa);
  fireEvent.focus(qa);
  expect(qa.classList.contains("is-active")).toBe(true);
  fireEvent.blur(qa);
  expect(qa.classList.contains("is-active")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "深色模式" }));
  expect(onTheme).toHaveBeenCalledWith("dark");
  rerender(<Hero theme="dark" onTheme={onTheme}/>);
  expect(document.querySelectorAll(".hi-photo-scene")).toHaveLength(1);
  expect(document.querySelector(".hi-photo-scene")?.getAttribute("src")).toBe("/home-hero/scene-dark.webp");
  expect(screen.getByTestId("particles").getAttribute("data-theme")).toBe("dark");
 });
});
