'use client';

import { useId } from 'react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { ParamProps } from '@/types/appnode';

export default function StringParam({ param, value, updateNodeParamValue, disabled }: ParamProps) {
  const id = useId();

  let Component: any = Input;
  if (param.variant === 'textarea') {
    Component = Textarea;
  }

  return (
    <div className="space-y-1 p-1 w-full">
      <Label htmlFor={id} className="text-xs flex">
        {param.name}
        {param.required && <p className="text-red-400 px-2">*</p>}
      </Label>
      <Component
        id={id}
        disabled={disabled}
        className="text-xs "
        key={String(value ?? '')}
        defaultValue={value || ''}
        placeholder="Enter value here"
        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => updateNodeParamValue(e.target.value)}
      />
      {param.helperText && <p className="text-muted-foreground px-2">{param.helperText}</p>}
    </div>
  );
}
