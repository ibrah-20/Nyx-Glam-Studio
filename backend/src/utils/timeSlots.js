/**
 * Generates an array of time strings (HH:MM:SS) between start and end with the given interval.
 */
function generateTimeSlots(startHour = 9, endHour = 20, intervalMinutes = 30) {
  const slots = [];
  let current = new Date();
  current.setHours(startHour, 0, 0, 0);
  
  const end = new Date();
  end.setHours(endHour, 0, 0, 0);

  while (current < end) {
    const hours = String(current.getHours()).padStart(2, '0');
    const minutes = String(current.getMinutes()).padStart(2, '0');
    slots.push(`${hours}:${minutes}:00`);
    
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return slots;
}

/**
 * Adds minutes to a given time string (HH:MM:SS).
 */
function addMinutesToTime(timeStr, minutesToAdd) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes + minutesToAdd, seconds || 0);
  
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

/**
 * Checks if two time intervals [start1, end1) and [start2, end2) overlap.
 * Times should be strings in format HH:MM:SS
 */
function checkOverlap(start1, end1, start2, end2) {
  return (start1 < end2) && (start2 < end1);
}

module.exports = {
  generateTimeSlots,
  addMinutesToTime,
  checkOverlap
};
