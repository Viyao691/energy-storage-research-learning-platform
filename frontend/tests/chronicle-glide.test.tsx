// @vitest-environment jsdom
import React from "react";
import {cleanup,render,screen,within,fireEvent} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach,expect,it} from "vitest";
import {ChronicleExhibition} from "../components/chronicle/ChronicleExhibition";
import {researchRoutes} from "../lib/chronicle/researchRoutes";
afterEach(cleanup);
it("四类动效选择保持路线联动、素材和详解状态",async()=>{
 const user=userEvent.setup();render(<ChronicleExhibition/>);
 async function pick(name:string,label:string){await user.click(screen.getByRole("combobox",{name}));await user.click(screen.getByRole("option",{name:label}));}
 await pick("家族","热储能");expect(screen.getByRole("combobox",{name:"路线"}).textContent).toContain("显热储能");
 await pick("路线","潜热储能");expect(screen.getByRole("navigation",{name:"历史年份"})).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"材料"}));
 const material=researchRoutes["潜热储能"].materials[1];await pick("材料路线",material.label);expect(screen.getByRole("heading",{name:material.title})).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"企业"}));const company=researchRoutes["潜热储能"].companies[1];
 await pick("企业",company.label);expect(screen.getByRole("heading",{name:company.label+" · "+company.title})).toBeTruthy();
 expect(within(screen.getByRole("region",{name:"技术展厅"})).getByRole("img").getAttribute("src")).toContain("sunamp");
 fireEvent.click(screen.getByRole("button",{name:"进入详解"}));await pick("企业",researchRoutes["潜热储能"].companies[0].label);
 expect(screen.getByRole("button",{name:/返回现场/})).toBeTruthy();fireEvent.click(screen.getByRole("button",{name:/返回现场/}));
 expect(screen.getByRole("combobox",{name:"企业"}).textContent).toContain(researchRoutes["潜热储能"].companies[0].label);
});
it("键盘与外点关闭，文字swap只在编年史启用",async()=>{
 const user=userEvent.setup();render(<ChronicleExhibition/>);const route=screen.getByRole("combobox",{name:"路线"});route.focus();
 await user.keyboard("{ArrowDown}{Home}{Enter}");expect(route.textContent).toContain("锂离子");
 expect(route.querySelector(".glide-select__label--swap")).toBeTruthy();
 await user.click(route);expect(screen.getByRole("listbox").parentElement?.className).toContain("chronicleGlideMenu");
 await user.keyboard("{Escape}");expect(route.getAttribute("aria-expanded")).toBe("false");
 await user.click(route);await user.click(screen.getByRole("button",{name:"暂停动效"}));expect(route.getAttribute("aria-expanded")).toBe("false");
});