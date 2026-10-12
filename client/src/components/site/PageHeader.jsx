export default function PageHeader({ title, subtitle }) {
  return (
    <div className="bg-primary px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-green-100">{subtitle}</p>}
      </div>
    </div>
  );
}
