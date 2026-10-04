"use client";

import GlideSelect from "../react-bits/GlideSelect";
import type { ModelChoice } from "../../lib/modelCatalog";
import React, { useState } from "react";

type Props = {
  id: string;
  value: string;
  options: ModelChoice[];
  onChange: (value: string) => void;
  placeholder: string;
};

export default function SettingsModelPicker({ id, value, options, onChange, placeholder }: Props) {
  const [customMode, setCustomMode] = useState(false);
  const known = options.some(option => option.value === value);
  const custom = !known && value !== "";
  const showInput = customMode || custom || options.length === 0;
  return <>
    <GlideSelect id={id} value={showInput ? "__custom__" : value} onChange={next => { setCustomMode(next === "__custom__"); onChange(next === "__custom__" ? (showInput ? value : "") : next); }} options={[...options, { value: "__custom__", label: "自定义模型 ID" }]} placeholder="选择模型" />
    {showInput && <input aria-label={`${placeholder}（自定义）`} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />}
  </>;
}
