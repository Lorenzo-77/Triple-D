export default function DaySelector({ days, currentDay, onSelectDay }) {
  return (
    <nav className="day-selector" aria-label="Selector de día de entrenamiento">
      {days.map((day) => {
        const isActive = currentDay === day;
        return (
          <button
            key={day}
            type="button"
            className={`day-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectDay(day)}
            aria-selected={isActive}
            role="tab"
          >
            {day}
          </button>
        );
      })}
    </nav>
  );
}