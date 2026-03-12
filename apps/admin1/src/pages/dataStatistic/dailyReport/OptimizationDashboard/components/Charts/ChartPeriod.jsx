function ChartPeriod({ options = ["天", "周", "月"], value, onChange }) {
  return (
    <div className="chart-period">
      {options.map((option) => (
        <span
          key={option}
          className={value === option ? "active" : ""}
          onClick={() => onChange?.(option)}
        >
          {option}
        </span>
      ))}
    </div>
  )
}

export default ChartPeriod
