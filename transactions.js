// 1. The data. Negative = money spent, positive = money received.
let transactions = [
  { id: 1, date: "2026-10-18", description: "Shoprite groceries",       category: "Food",      amount: -18400 },
  { id: 2, date: "2026-10-16", description: "Freelance design project", category: "Others",    amount: 85000 },
  { id: 3, date: "2026-10-14", description: "Uber Lagos ride",          category: "Transport", amount: -4500 },
  { id: 4, date: "2026-10-12", description: "Ikeja Electric token",     category: "Utilities", amount: -12000 },
  { id: 5, date: "2026-10-05", description: "Zara Palms Lekki",         category: "Shopping",  amount: -15000 },
  { id: 6, date: "2026-10-02", description: "Miscellaneous hardware",   category: "Others",    amount: -6000 },
  { id: 7, date: "2026-10-01", description: "Monthly Tech Salary",      category: "Others",    amount: 450000 },
  { id: 8, date: "2026-10-01", description: "Apartment service charge", category: "Rent",      amount: -25000 },
];

// 2. Colours for the little dots beside each category.
const dotColors = {
  Food: "#d97706", Others: "#6b7280", Transport: "#2563eb",
  Utilities: "#7c3aed", Shopping: "#e11d48", Rent: "#0b6b3a",
};

// 3. What the user has chosen right now.
const PAGE_SIZE = 5;
let state = { type: "all", search: "", category: "all", min: 0, max: 500000, page: 1 };

// 4. Small helpers.
const $ = (id) => document.getElementById(id);
const naira = (n) => "₦" + Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });
const prettyDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// Keep only the transactions that match what the user chose.
function getFiltered() {
  return transactions.filter((t) => {
    const size = Math.abs(t.amount);
    const matchesType = state.type === "all" || (state.type === "income" ? t.amount > 0 : t.amount < 0);
    const matchesSearch = t.description.toLowerCase().includes(state.search.toLowerCase());
    const matchesCategory = state.category === "all" || t.category === state.category;
    return matchesType && matchesSearch && matchesCategory && size >= state.min && size <= state.max;
  });
}

// Fill the three cards.
function renderSummary() {
  const inflow = transactions.filter((t) => t.amount > 0);
  const outflow = transactions.filter((t) => t.amount < 0);
  const totalIn = inflow.reduce((sum, t) => sum + t.amount, 0);
  const totalOut = outflow.reduce((sum, t) => sum + t.amount, 0);
  const net = totalIn + totalOut;
  $("totalIn").textContent = "+" + naira(totalIn);
  $("totalOut").textContent = "−" + naira(totalOut);
  $("net").textContent = (net >= 0 ? "+" : "−") + naira(net);
  $("inCount").textContent = inflow.length + " deposit records";
  $("outCount").textContent = outflow.length + " expenditure items";
}

// Draw the table rows, the "Showing..." text and the page buttons.
function renderTable() {
  const list = getFiltered();
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  if (state.page > pages) state.page = pages;

  const start = (state.page - 1) * PAGE_SIZE;
  const visible = list.slice(start, start + PAGE_SIZE);

  $("rows").innerHTML = visible.length
    ? visible.map((t) => `
      <tr>
        <td>${prettyDate(t.date)}</td>
        <td>${t.description}</td>
        <td><span class="pill"><span class="dot" style="background:${dotColors[t.category]}"></span>${t.category}</span></td>
        <td class="right amount ${t.amount > 0 ? "green" : "red"}">${t.amount > 0 ? "+" : "−"}${naira(t.amount)}</td>
        <td class="right">
          <button class="link" onclick="editTransaction(${t.id})">Edit</button>
          <button class="link danger" onclick="deleteTransaction(${t.id})">Delete</button>
        </td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="empty">No transactions match your filters.</td></tr>`;

  $("showing").textContent = list.length
    ? `Showing ${start + 1}–${start + visible.length} of ${list.length} transactions`
    : "Showing 0 transactions";

  let buttons = `<button ${state.page === 1 ? "disabled" : ""} onclick="goToPage(${state.page - 1})">Previous</button>`;
  for (let p = 1; p <= pages; p++) {
    buttons += `<button class="${p === state.page ? "active" : ""}" onclick="goToPage(${p})">${p}</button>`;
  }
  buttons += `<button ${state.page === pages ? "disabled" : ""} onclick="goToPage(${state.page + 1})">Next</button>`;
  $("pager").innerHTML = buttons;
}

function renderAll() {
  renderSummary();
  renderTable();
}

function goToPage(p) {
  state.page = p;
  renderTable();
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction? This cannot be undone.")) return;
  transactions = transactions.filter((t) => t.id !== id);
  renderAll();
}

function editTransaction(id) {
  const t = transactions.find((x) => x.id === id);
  const name = prompt("Change the description:", t.description);
  if (name && name.trim()) {
    t.description = name.trim();
    renderTable();
  }
}

$("addBtn").addEventListener("click", () => {
  const description = prompt("What was it for?");
  if (!description) return;
  const amount = Number(prompt("Amount in Naira (minus for money spent, e.g. -2500):"));
  if (!amount) return alert("Please type a number, like -2500 or 50000.");
  const category = prompt("Category (Food, Transport, Utilities, Shopping, Rent, Others):", "Others");
  transactions.unshift({
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    description: description.trim(),
    category: dotColors[category] ? category : "Others",
    amount: amount,
  });
  state.page = 1;
  renderAll();
});

function listen(id, key, convert = (v) => v) {
  $(id).addEventListener("input", (e) => {
    state[key] = convert(e.target.value);
    state.page = 1;
    renderTable();
  });
}
listen("search", "search");
listen("category", "category");
listen("min", "min", (v) => Number(v) || 0);
listen("max", "max", (v) => Number(v) || Infinity);

$("tabs").addEventListener("click", (e) => {
  if (!e.target.dataset.type) return;
  document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
  e.target.classList.add("active");
  state.type = e.target.dataset.type;
  state.page = 1;
  renderTable();
});

// Start! Draw everything once when the page loads.
renderAll();