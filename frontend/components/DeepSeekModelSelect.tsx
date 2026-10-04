import React from "react";
import GlideSelect from "./react-bits/GlideSelect";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function DeepSeekModelSelect({ value, onChange }: Props) {
  return (
    <GlideSelect ariaLabel="模型名称" value={value} onChange={onChange} options={[
      { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash（快速模型）" },
      { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro（深度模型）" },
      { value: "deepseek-v4-flash-vision-exp", label: "DeepSeek V4 Flash Vision（视觉实验版）" },
    ]} />
  );
}
