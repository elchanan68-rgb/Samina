const members = [
  { id: "elchanan", name: "אלחנן", emoji: "🏃", note: "בקצב שלך" },
  { id: "elia", name: "אליה", emoji: "🚴", note: "כל אימון נחשב" },
  { id: "yossi", name: "יוסי", emoji: "🏋️", note: "מתקדמים ביחד" },
  { id: "natan", name: "נתן", emoji: "⚽", note: "יאללה, זזים" },
];

const activities = [
  { id: "strength", name: "אימון כוח", emoji: "🏋️" },
  { id: "run", name: "ריצה", emoji: "🏃" },
  { id: "walk", name: "הליכה", emoji: "🚶" },
  { id: "cycling", name: "אופניים", emoji: "🚴" },
  { id: "ball", name: "משחק כדור", emoji: "⚽" },
  { id: "other", name: "אימון אחר", emoji: "🧘" },
];

const weekdays = [
  { name: "שני", shortName: "ב׳" },
  { name: "שלישי", shortName: "ג׳" },
  { name: "רביעי", shortName: "ד׳" },
  { name: "חמישי", shortName: "ה׳" },
  { name: "שישי", shortName: "ו׳" },
  { name: "שבת", shortName: "ש׳" },
  { name: "ראשון", shortName: "א׳" },
];
const weeklyGoal = 12;
const storagePrefix = "friends-workout-tracker:";
const memberById = new Map(members.map((member) => [member.id, member]));
const activityById = new Map(activities.map((activity) => [activity.id, activity]));
const notice = document.querySelector("#storage-notice");
const tableBody = document.querySelector("#members-table");
const activityList = document.querySelector("#activity-list");

let weekStart = getWeekStart(new Date());
let weekRecords = loadWeekRecords(getWeekKey(weekStart));
let sharedSchedule = loadSharedSchedule(getWeekKey(weekStart));

function getWeekStart(date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function getWeekKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStorageKey() {
  return `${storagePrefix}${getWeekKey(weekStart)}`;
}

function getSharedStorageKey(key = getWeekKey(weekStart)) {
  return `${storagePrefix}shared:${key}`;
}

function createDefaultSharedSchedule() {
  return { day: 1, completed: false, videoUrl: "" };
}

function getCoachVideoId(value) {
  if (value === "") {
    return "";
  }

  try {
    const url = new URL(value);
    const allowedHosts = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be", "www.youtube-nocookie.com"];
    if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname)) {
      return null;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    let videoId = "";
    if (url.hostname.endsWith("youtu.be")) {
      videoId = pathParts[0] ?? "";
    } else if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") ?? "";
    } else if (["embed", "shorts", "live"].includes(pathParts[0])) {
      videoId = pathParts[1] ?? "";
    }

    return /^[\w-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

function isAllowedCoachVideoUrl(value) {
  return getCoachVideoId(value) !== null;
}

function loadSharedSchedule(key) {
  try {
    const savedSchedule = localStorage.getItem(getSharedStorageKey(key));
    if (savedSchedule === null) {
      return createDefaultSharedSchedule();
    }

    const schedule = JSON.parse(savedSchedule);
    if (
      !schedule ||
      !Number.isInteger(schedule.day) ||
      schedule.day < 0 ||
      schedule.day >= weekdays.length ||
      typeof schedule.completed !== "boolean" ||
      typeof schedule.videoUrl !== "string" ||
      !isAllowedCoachVideoUrl(schedule.videoUrl)
    ) {
      throw new Error("פרטי האימון המשותף השמורים אינם תקינים.");
    }

    return schedule;
  } catch (error) {
    showNotice(`לא הצלחנו לקרוא את פרטי האימון המשותף לשבוע הזה. ${error.message}`);
    return createDefaultSharedSchedule();
  }
}

function saveSharedSchedule() {
  try {
    localStorage.setItem(getSharedStorageKey(), JSON.stringify(sharedSchedule));
    clearNotice();
  } catch (error) {
    showNotice(`לא הצלחנו לשמור את פרטי האימון המשותף בדפדפן. ${error.message}`);
  }
}

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = false;
}

function clearNotice() {
  notice.textContent = "";
  notice.hidden = true;
}

function loadWeekRecords(key) {
  try {
    const savedRecords = localStorage.getItem(`${storagePrefix}${key}`);
    if (savedRecords === null) {
      return [];
    }

    const parsedRecords = JSON.parse(savedRecords);
    if (!Array.isArray(parsedRecords)) {
      throw new Error("הנתונים השמורים אינם בפורמט הצפוי.");
    }

    for (const record of parsedRecords) {
      if (
        !record ||
        typeof record.id !== "string" ||
        !memberById.has(record.memberId) ||
        !activityById.has(record.activityId) ||
        typeof record.createdAt !== "string" ||
        Number.isNaN(Date.parse(record.createdAt))
      ) {
        throw new Error("נמצאו נתוני אימון לא תקינים.");
      }
    }

    return parsedRecords;
  } catch (error) {
    showNotice(`לא הצלחנו לקרוא את האימונים השמורים לשבוע הזה. ${error.message}`);
    return [];
  }
}

function saveWeekRecords() {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(weekRecords));
    clearNotice();
  } catch (error) {
    showNotice(`לא הצלחנו לשמור את השינוי בדפדפן. האימון יוצג כרגע, אך ייתכן שלא יישמר לאחר סגירת הדף. ${error.message}`);
  }
}

function createMemberRows() {
  for (const [index, member] of members.entries()) {
    const row = document.createElement("tr");

    const memberCell = document.createElement("td");
    memberCell.dataset.label = "המתאמן";
    const memberInfo = document.createElement("div");
    memberInfo.className = "member-cell";
    const avatar = document.createElement("span");
    avatar.className = "member-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = member.emoji;
    const details = document.createElement("span");
    details.className = "member-details";
    const name = document.createElement("strong");
    name.textContent = member.name;
    const noteText = document.createElement("span");
    noteText.textContent = member.note;
    details.append(name, noteText);
    memberInfo.append(avatar, details);
    memberCell.append(memberInfo);

    const countCell = document.createElement("td");
    countCell.className = "count-cell";
    countCell.dataset.label = "כמה אימונים?";
    const countPill = document.createElement("span");
    countPill.className = "count-pill";
    const count = document.createElement("strong");
    count.dataset.countFor = member.id;
    count.textContent = "0";
    const countLabel = document.createElement("span");
    countLabel.textContent = "אימונים";
    countPill.append(count, countLabel);
    countCell.append(countPill);

    const controlsCell = document.createElement("td");
    controlsCell.dataset.label = "מוסיפים אימון";
    const controls = document.createElement("div");
    controls.className = "log-controls";
    const select = document.createElement("select");
    select.className = "activity-select";
    select.setAttribute("aria-label", `סוג האימון של ${member.name}`);

    for (const activity of activities) {
      const option = document.createElement("option");
      option.value = activity.id;
      option.textContent = `${activity.emoji} ${activity.name}`;
      select.append(option);
    }

    const addButton = document.createElement("button");
    addButton.className = "log-button";
    addButton.type = "button";
    addButton.setAttribute("aria-label", `הוספת אימון עבור ${member.name}`);
    addButton.innerHTML = "<span aria-hidden=\"true\">+</span> הוספתי אימון";
    addButton.addEventListener("click", () => addWorkout(member.id, select.value));
    controls.append(select, addButton);
    controlsCell.append(controls);

    row.append(memberCell, countCell, controlsCell);
    tableBody.append(row);
  }
}

function addWorkout(memberId, activityId) {
  if (!memberById.has(memberId) || !activityById.has(activityId)) {
    showNotice("לא הצלחנו להוסיף את האימון: המתאמן או סוג האימון לא תקינים.");
    return;
  }

  weekRecords.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    memberId,
    activityId,
    createdAt: new Date().toISOString(),
  });
  saveWeekRecords();
  renderWeek();
}

function removeWorkout(recordId) {
  weekRecords = weekRecords.filter((record) => record.id !== recordId);
  saveWeekRecords();
  renderWeek();
}

function formatWeekLabel() {
  const endOfWeek = new Date(weekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  const formatter = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });
  return `שבוע ${formatter.format(weekStart)} – ${formatter.format(endOfWeek)}`;
}

function renderActivity() {
  activityList.replaceChildren();
  const recentRecords = [...weekRecords]
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));

  if (recentRecords.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "עוד אין אימונים בשבוע הזה. בואו להיות הראשונים לסמן אחד!";
    activityList.append(empty);
    return;
  }

  for (const record of recentRecords) {
    const member = memberById.get(record.memberId);
    const activity = activityById.get(record.activityId);
    const item = document.createElement("li");
    item.className = "activity-item";

    const icon = document.createElement("span");
    icon.className = "activity-item-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = activity.emoji;

    const copy = document.createElement("span");
    copy.className = "activity-item-copy";
    const title = document.createElement("strong");
    title.textContent = `${member.name} · ${activity.name}`;
    const time = document.createElement("span");
    time.textContent = new Intl.DateTimeFormat("he-IL", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(record.createdAt));
    copy.append(title, time);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-workout";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `מחיקת אימון ${activity.name} של ${member.name}`);
    deleteButton.title = "מחיקת אימון";
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => removeWorkout(record.id));

    item.append(icon, copy, deleteButton);
    activityList.append(item);
  }
}

function renderSharedWorkout() {
  const calendar = document.querySelector("#shared-calendar");
  calendar.replaceChildren();

  for (const [index, weekday] of weekdays.entries()) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);

    const dayButton = document.createElement("button");
    dayButton.className = "calendar-day";
    dayButton.type = "button";
    dayButton.setAttribute("aria-pressed", String(sharedSchedule.day === index));
    dayButton.setAttribute(
      "aria-label",
      `יום ${weekday.name}${sharedSchedule.day === index ? ", יום האימון שנבחר" : ""}${sharedSchedule.day === index && sharedSchedule.completed ? ", האימון התקיים" : ""}`,
    );
    if (sharedSchedule.day === index) {
      dayButton.classList.add("is-selected");
    }

    const dayName = document.createElement("span");
    dayName.className = "calendar-day-name";
    dayName.textContent = weekday.shortName;
    const dateNumber = document.createElement("span");
    dateNumber.className = "calendar-date";
    dateNumber.textContent = String(date.getDate());
    const marker = document.createElement("span");
    marker.className = "calendar-marker";
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = sharedSchedule.day === index ? (sharedSchedule.completed ? "✓" : "•") : "";
    dayButton.append(dayName, dateNumber, marker);
    dayButton.addEventListener("click", () => {
      if (sharedSchedule.day === index) {
        return;
      }

      sharedSchedule.day = index;
      sharedSchedule.completed = false;
      saveSharedSchedule();
      renderSharedWorkout();
    });
    calendar.append(dayButton);
  }

  const day = weekdays[sharedSchedule.day];
  document.querySelector("#shared-day-label").textContent = `יום ${day.name}`;
  document.querySelector("#shared-week-label").textContent = formatWeekLabel();

  const completeButton = document.querySelector("#shared-complete");
  completeButton.classList.toggle("is-complete", sharedSchedule.completed);
  completeButton.setAttribute("aria-pressed", String(sharedSchedule.completed));
  completeButton.innerHTML = sharedSchedule.completed
    ? "האימון התקיים! <span aria-hidden=\"true\">↶</span>"
    : "סמנו שהתקיים <span aria-hidden=\"true\">✓</span>";

  const videoInput = document.querySelector("#coach-video-url");
  const videoLink = document.querySelector("#coach-video-link");
  const videoEmbed = document.querySelector("#coach-video-embed");
  const videoFrame = document.querySelector("#coach-video-frame");
  if (document.activeElement !== videoInput) {
    videoInput.value = sharedSchedule.videoUrl;
  }
  videoLink.hidden = sharedSchedule.videoUrl === "";
  videoEmbed.hidden = sharedSchedule.videoUrl === "";
  if (sharedSchedule.videoUrl !== "") {
    videoLink.href = sharedSchedule.videoUrl;
    videoFrame.src = `https://www.youtube-nocookie.com/embed/${getCoachVideoId(sharedSchedule.videoUrl)}`;
  } else {
    videoFrame.removeAttribute("src");
  }
}

function renderWeek() {
  document.querySelector("#week-label").textContent = formatWeekLabel();

  const counts = new Map(members.map((member) => [member.id, 0]));
  for (const record of weekRecords) {
    counts.set(record.memberId, counts.get(record.memberId) + 1);
  }

  for (const member of members) {
    document.querySelector(`[data-count-for="${member.id}"]`).textContent = String(counts.get(member.id));
  }

  const total = weekRecords.length;
  const activeMembers = [...counts.values()].filter((count) => count > 0).length;
  document.querySelector("#total-workouts").textContent = String(total);
  document.querySelector("#active-members").innerHTML = `${activeMembers}<span class="stat-suffix">/4</span>`;
  document.querySelector("#goal-count").textContent = `${total} מתוך ${weeklyGoal}`;
  document.querySelector("#goal-progress").setAttribute("aria-valuenow", String(Math.min(total, weeklyGoal)));
  document.querySelector("#goal-progress-fill").style.width = `${Math.min((total / weeklyGoal) * 100, 100)}%`;

  renderActivity();
  renderSharedWorkout();
}

function changeWeek(days) {
  weekStart = new Date(weekStart);
  weekStart.setDate(weekStart.getDate() + days);
  weekRecords = loadWeekRecords(getWeekKey(weekStart));
  sharedSchedule = loadSharedSchedule(getWeekKey(weekStart));
  renderWeek();
}

createMemberRows();
renderWeek();

document.querySelector("#previous-week").addEventListener("click", () => changeWeek(-7));
document.querySelector("#next-week").addEventListener("click", () => changeWeek(7));
document.querySelector("#current-week").addEventListener("click", () => {
  weekStart = getWeekStart(new Date());
  weekRecords = loadWeekRecords(getWeekKey(weekStart));
  sharedSchedule = loadSharedSchedule(getWeekKey(weekStart));
  renderWeek();
});

document.querySelector("#shared-complete").addEventListener("click", () => {
  sharedSchedule.completed = !sharedSchedule.completed;
  saveSharedSchedule();
  renderSharedWorkout();
});

document.querySelector("#coach-video-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#coach-video-url");
  const status = document.querySelector("#video-status");
  const videoUrl = input.value.trim();

  if (!isAllowedCoachVideoUrl(videoUrl)) {
    status.textContent = "יש להדביק קישור לסרטון YouTube תקין (youtube.com או youtu.be).";
    input.setAttribute("aria-invalid", "true");
    return;
  }

  input.removeAttribute("aria-invalid");
  sharedSchedule.videoUrl = videoUrl;
  saveSharedSchedule();
  status.textContent = videoUrl === "" ? "קישור הסרטון הוסר." : "קישור הסרטון נשמר לשבוע הזה.";
  renderSharedWorkout();
});

window.addEventListener("storage", (event) => {
  if (event.key === getStorageKey()) {
    weekRecords = loadWeekRecords(getWeekKey(weekStart));
    renderWeek();
  }

  if (event.key === getSharedStorageKey()) {
    sharedSchedule = loadSharedSchedule(getWeekKey(weekStart));
    renderSharedWorkout();
  }
});
