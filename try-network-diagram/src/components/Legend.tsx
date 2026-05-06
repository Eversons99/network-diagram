const legendItems = [
  { label: "Provisionamento IXC", tone: "ixc" },
  { label: "DHCP", tone: "dhcp" },
  { label: "TR069 / ACS", tone: "tr069" },
  { label: "Transporte L2", tone: "base" },
];

export function Legend() {
  return (
    <div className="legend">
      {legendItems.map((item) => (
        <span key={item.label} className="legend-item">
          <i className={`legend-dot tone-${item.tone}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
