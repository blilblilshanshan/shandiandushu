const STORAGE_KEY = "shandiandushu_books";
const ADMIN_PASSWORD = "123456";

const adminLoginBtn = document.getElementById("admin-login-btn");
const adminLogoutBtn = document.getElementById("admin-logout-btn");
const adminPanel = document.getElementById("admin-panel");
const bookListEl = document.getElementById("book-list");
const bookCountEl = document.getElementById("book-count");
const readerEmptyEl = document.getElementById("reader-empty");
const readerViewEl = document.getElementById("reader-view");
const readerTitleEl = document.getElementById("reader-title");
const readerContentEl = document.getElementById("reader-content");
const downloadBtn = document.getElementById("download-btn");
const bookForm = document.getElementById("book-form");
const bookTitleInput = document.getElementById("book-title");
const bookContentInput = document.getElementById("book-content");
const txtUploadInput = document.getElementById("txt-upload");
const newBookBtn = document.getElementById("new-book-btn");

let books = [];
let activeBookId = null;
let isAdmin = false;

function createDefaultBooks() {
  return [
    {
      id: crypto.randomUUID(),
      title: "闪电读书入门",
      content:
        "欢迎来到闪电读书。\n\n这是一本为新用户准备的示例书籍。\n\n你可以先阅读它，随后用管理员密码登录，编写自己的书籍并上传 TXT 文档。"
    }
  ];
}

function loadBooks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      books = createDefaultBooks();
      saveBooks();
      return;
    }
    books = JSON.parse(stored);
    if (!Array.isArray(books) || books.length === 0) {
      books = createDefaultBooks();
      saveBooks();
    }
  } catch (error) {
    books = createDefaultBooks();
    saveBooks();
  }
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  renderBooksList();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBooksList() {
  bookCountEl.textContent = `${books.length} 本书`;
  if (!books.length) {
    bookListEl.innerHTML = '<p class="empty-state">当前还没有书籍。</p>';
    return;
  }

  if (!activeBookId || !books.some((book) => book.id === activeBookId)) {
    activeBookId = books[0].id;
  }

  bookListEl.innerHTML = books
    .map((book) => {
      const activeClass = book.id === activeBookId ? "active" : "";
      return `
        <button class="book-item ${activeClass}" data-id="${book.id}">
          <strong>${escapeHtml(book.title)}</strong>
        </button>
      `;
    })
    .join("");

  renderReader();
}

function renderReader() {
  const activeBook = books.find((book) => book.id === activeBookId);
  if (!activeBook) {
    readerEmptyEl.classList.remove("hidden");
    readerViewEl.classList.add("hidden");
    return;
  }

  readerEmptyEl.classList.add("hidden");
  readerViewEl.classList.remove("hidden");
  readerTitleEl.textContent = activeBook.title;
  readerContentEl.innerHTML = `<pre>${escapeHtml(activeBook.content)}</pre>`;
}

function fillEditor(book) {
  bookTitleInput.value = book?.title || "";
  bookContentInput.value = book?.content || "";
}

function openBook(id) {
  activeBookId = id;
  renderBooksList();
  const selectedBook = books.find((book) => book.id === id);
  if (selectedBook) {
    fillEditor(selectedBook);
  }
}

function handleAdminLogin() {
  const input = prompt("请输入管理员密码");
  if (input === ADMIN_PASSWORD) {
    isAdmin = true;
    adminPanel.classList.remove("hidden");
    adminLoginBtn.classList.add("hidden");
    adminLogoutBtn.classList.remove("hidden");
    alert("管理员已登录，可以开始编书了。" );
  } else if (input !== null) {
    alert("密码错误，请重试。" );
  }
}

function handleAdminLogout() {
  isAdmin = false;
  adminPanel.classList.add("hidden");
  adminLoginBtn.classList.remove("hidden");
  adminLogoutBtn.classList.add("hidden");
}

function handleFormSubmit(event) {
  event.preventDefault();
  const title = bookTitleInput.value.trim();
  const content = bookContentInput.value.trim();
  if (!title || !content) {
    alert("请填写书名和内容。" );
    return;
  }

  const existing = books.find((book) => book.id === activeBookId);
  if (existing) {
    existing.title = title;
    existing.content = content;
  } else {
    const newBook = {
      id: crypto.randomUUID(),
      title,
      content
    };
    books.unshift(newBook);
    activeBookId = newBook.id;
  }

  saveBooks();
  fillEditor(books.find((book) => book.id === activeBookId));
  alert("书籍已保存。" );
}

function handleNewBook() {
  activeBookId = null;
  fillEditor(null);
  renderBooksList();
}

function handleTxtUpload(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result || "";
    const title = file.name.replace(/\.txt$/i, "") || "新上传的书";
    bookTitleInput.value = title;
    bookContentInput.value = text;
    activeBookId = null;
  };
  reader.readAsText(file, "utf-8");
}

function handleDownload() {
  const activeBook = books.find((book) => book.id === activeBookId);
  if (!activeBook) return;

  const blob = new Blob([activeBook.content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${activeBook.title}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function init() {
  loadBooks();
  renderBooksList();
  fillEditor(books.find((book) => book.id === activeBookId));

  adminLoginBtn.addEventListener("click", handleAdminLogin);
  adminLogoutBtn.addEventListener("click", handleAdminLogout);
  bookListEl.addEventListener("click", (event) => {
    const button = event.target.closest(".book-item");
    if (!button) return;
    openBook(button.getAttribute("data-id"));
  });
  bookForm.addEventListener("submit", handleFormSubmit);
  newBookBtn.addEventListener("click", handleNewBook);
  txtUploadInput.addEventListener("change", handleTxtUpload);
  downloadBtn.addEventListener("click", handleDownload);
}

init();
