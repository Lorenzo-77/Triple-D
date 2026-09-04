export default function DaySelector({ days, currentDay, onSelectDay }) {
  return (
    <div className="day-selector">
      {days.map((day) => (
        <button
          key={day}
          type="button"
          className={`day-btn ${currentDay === day ? 'active' : ''}`}
          onClick={() => onSelectDay(day)}
        >
          {day}
        </button>
      ))}
    </div>
  );
}