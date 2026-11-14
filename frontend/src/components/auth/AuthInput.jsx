/**
 * Labeled icon input used by the Staff Login modal (email, password).
 * The icon sits behind a vertical divider, the label floats above the
 * value, and `children` renders trailing controls such as the password
 * visibility toggle.
 */
export default function AuthInput({ icon: Icon, label, id, children, ...inputProps }) {
  return (
    <div className="relative flex items-center bg-[#150f2e] border border-[#241a4a] rounded-xl px-3.5 py-2.5 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-colors">
      <div className="text-slate-400 mr-3 shrink-0">
        <Icon aria-hidden="true" className="w-5 h-5" strokeWidth={1.8} />
      </div>
      <div className="w-px h-6 bg-[#2a1e54] mr-3 shrink-0" />
      <div className="flex-1 min-w-0">
        <label className="block text-[10px] text-slate-400 font-medium leading-none mb-1" htmlFor={id}>
          {label}
        </label>
        <input
          className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0"
          id={id}
          {...inputProps}
        />
      </div>
      {children}
    </div>
  )
}
