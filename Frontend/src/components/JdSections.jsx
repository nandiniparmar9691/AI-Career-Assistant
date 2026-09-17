const SectionCard = ({ icon: Icon, title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
      <Icon className="h-5 w-5 text-indigo-600" />
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    <div className="px-5 py-4">{children}</div>
  </section>
)

const BadgeList = ({ items }) =>
  Array.isArray(items) && items.length ? (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
        >
          {item}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-sm text-slate-500">Not mentioned</p>
  )

const BulletList = ({ items }) =>
  Array.isArray(items) && items.length ? (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-slate-500">Not mentioned</p>
  )

export { SectionCard, BadgeList, BulletList }