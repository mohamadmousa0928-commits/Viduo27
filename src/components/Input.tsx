import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
  icon?: ReactNode;
  hint?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, icon, hint, className = '', ...rest }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="label">{label}</label>}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`input ${icon ? 'pl-10' : ''} ${
              error ? 'border-error focus:border-error' : ''
            } ${className}`}
            {...rest}
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-error">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
