const body = document.body;
const toast = document.querySelector(".toast");
const isLocalFile = window.location.protocol === "file:";

function currentRoutePage() {
  const path = window.location.pathname;
  return path === "/courses" || path.startsWith("/courses/")
    ? "courses" : path === "/resources" ? "resources" : path === "/placements" ? "placements" : path === "/success-stories" ? "success-stories" : path === "/about" ? "about" : path.startsWith("/admin/")
      ? "admin" : path.startsWith("/student/") ? "student" : "home";
}

function routeShell(title, intro, content) {
  const main = document.querySelector("main");
  main.innerHTML = `<section class="section route-page"><div class="container"><span class="kicker">Tally With Tax</span><h1 class="route-title">${title}</h1><p class="route-intro">${intro}</p>${content}</div></section>`;
  document.querySelectorAll(".site-header a, footer a").forEach((link) => {
    if (["/courses", "/resources", "/placements", "/success-stories", "/about"].includes(link.getAttribute("href"))) link.addEventListener("click", routeNavigate);
  });
}

function routeNavigate(event) {
  const href = event.currentTarget.getAttribute("href");
  if (!href || !href.startsWith("/")) return;
  event.preventDefault();
  history.pushState({}, "", href);
  renderRoute();
}

async function renderRoute() {
  const routePath = window.location.pathname;
  const routePage = currentRoutePage();
  if (routePage === "home") return;
  if (routePage === "resources") {
    routeShell("Resources <em>for your next step.</em>", "Practical notes, study material and tools for accounting learners.", `<div class="resource-grid route-resource-grid"><a class="resource-card" href="/courses/tally-prime-gst"><span class="resource-icon">▤</span><div><span>Paid course material</span><h3>Tally Prime Exercise Notes</h3><p>Protected study material available after enrollment.</p></div><span class="arrow">↗</span></a><a class="resource-card" href="/resources"><span class="resource-icon purple">▣</span><div><span>Free guide</span><h3>GST interview questions</h3><p>Prepare for your next accounts interview.</p></div><span class="arrow">↗</span></a><a class="resource-card" href="/resources"><span class="resource-icon orange">⌘</span><div><span>Cheat sheet</span><h3>Top Tally shortcuts</h3><p>Work faster from your first day on the job.</p></div><span class="arrow">↗</span></a></div>`);
    return;
  }
  if (routePage === "placements") {
    routeShell("Placements <em>that move careers.</em>", "Discover verified opportunities, prepare with confidence and take your next step with Tally With Tax.", `<div class="stats-band route-placement-stats"><div class="stats"><div><strong>2,000<span>+</span></strong><small>Students trained</small></div><div><strong>87<span>%</span></strong><small>Placed within 90 days</small></div><div><strong>120<span>+</span></strong><small>Hiring partners</small></div><div><strong>4.9<span>/5</span></strong><small>Student rating</small></div></div></div><div class="placement-layout route-placement-layout"><div class="placement-copy"><span class="kicker">Your career, in motion</span><h2>From learning to <em>your first offer.</em></h2><p class="muted">Build a strong profile, find verified roles and get practical support from our placement team at every step.</p><div class="placement-steps"><div><span>01</span><p><b>Build your profile</b><small>Showcase your skills, course progress and career goals.</small></p></div><div><span>02</span><p><b>Discover your fit</b><small>Explore accounting, Tally, GST and Excel opportunities.</small></p></div><div><span>03</span><p><b>Get hired</b><small>Prepare for interviews and move confidently into your new role.</small></p></div></div><a class="button" href="/courses">Build job-ready skills <span>→</span></a></div><div class="jobs-panel"><div class="jobs-search"><input aria-label="Search jobs" placeholder="⌕  Search role, skill or company"><select aria-label="Location"><option>All locations</option><option>Delhi NCR</option><option>Mumbai</option><option>Bengaluru</option></select><button class="button button-small" type="button">Search</button></div><div class="job-tabs"><button class="active" type="button">Recommended</button><button type="button">Latest jobs</button><button type="button">Work from home</button></div><div class="job-list"><article class="job"><div class="company-logo orange">⚡</div><div class="job-info"><h4>Accounts Executive</h4><p>BrightLedger Solutions · Delhi NCR</p><div><span>₹20k–28k / month</span><span>● Tally + GST</span></div></div><button class="apply-button" data-open-modal="apply-modal" type="button">Apply</button></article><article class="job"><div class="company-logo navy">N</div><div class="job-info"><h4>Junior Accountant</h4><p>Northstar Retail · Gurugram</p><div><span>₹18k–24k / month</span><span>● Excel</span></div></div><button class="apply-button" data-open-modal="apply-modal" type="button">Apply</button></article><article class="job"><div class="company-logo purple">D</div><div class="job-info"><h4>GST Assistant</h4><p>DKM & Associates · Noida</p><div><span>₹22k–30k / month</span><span>● GST</span></div></div><button class="apply-button" data-open-modal="apply-modal" type="button">Apply</button></article></div></div></div>`);
    document.querySelectorAll("[data-open-modal]").forEach((trigger) => trigger.addEventListener("click", () => openModal(trigger.dataset.openModal)));
    return;
  }
  if (routePage === "success-stories") {
    routeShell("Success stories <em>that inspire.</em>", "Real learner journeys, practical wins and career progress from the Tally With Tax community.", `<div class="testimonial-grid route-testimonial-grid"><article class="testimonial featured-testimonial"><div class="quote-mark">“</div><blockquote>“I went from being unsure about accounting to confidently handling GST returns for my company. The practice sessions made all the difference.”</blockquote><div class="person"><span class="person-avatar">NS</span><div><b>Neha Sharma</b><small>Accounts Executive · Placed at FinEdge</small></div></div></article><article class="testimonial"><div class="video-thumb" data-video="https://www.youtube.com/embed/ScMzIvxBSi4"><span class="video-play">▶</span><span>Watch Neha's story</span></div><div class="person"><span class="person-avatar mint">AK</span><div><b>Arjun Kumar</b><small>Professional Accountant graduate</small></div></div></article><article class="testimonial"><div class="video-thumb coral" data-video="https://www.youtube.com/embed/ysz5S6PUM-U"><span class="video-play">▶</span><span>Watch Priya's story</span></div><div class="person"><span class="person-avatar yellow">PD</span><div><b>Priya Das</b><small>GST Specialist · Placed at Taxwise</small></div></div></article></div><div class="success-story-cta"><h2>Your success story <em>starts here.</em></h2><p class="muted">Build practical skills and prepare for your next career move.</p><a class="button" href="/courses">Explore courses <span>→</span></a></div>`);
    document.querySelectorAll(".route-testimonial-grid .video-thumb").forEach((video) => {
      video.addEventListener("click", () => {
        const frame = document.createElement("iframe");
        frame.src = `${video.dataset.video}?autoplay=1`;
        frame.title = "Student testimonial video";
        frame.allow = "autoplay; encrypted-media; picture-in-picture";
        frame.allowFullscreen = true;
        frame.className = "video-frame";
        video.replaceWith(frame);
      });
    });
    return;
  }
  if (routePage === "about") {
    routeShell("About <em>Tally With Tax.</em>", "Practical accounting education built around real work, real confidence and real career progress.", `<div class="about-grid route-about-grid"><div class="about-image"><div class="image-note"><b>12+</b><small>years of teaching<br>and doing</small></div></div><div><span class="kicker">The Tally With Tax way</span><h2>Learn from people who <em>do the work.</em></h2><p class="muted">We started with a simple belief: practical skills can change the direction of a career. Our trainers are accountants, tax practitioners and business operators who bring the real world into every class.</p><p class="muted">From Tally Prime and GST to Excel and professional accounting, every programme is designed to help learners practise confidently and become job-ready.</p><div class="trainer-row"><span class="trainer t1">RM</span><span class="trainer t2">SK</span><span class="trainer t3">AV</span><div><b>Meet your mentors</b><small>CA, CMA and industry practitioners</small></div></div><a class="button" href="/courses">Explore our courses <span>→</span></a></div></div><div class="about-values"><article><b>Practical first</b><p>Learn through invoices, ledgers, returns and real business cases.</p></article><article><b>Mentor-led</b><p>Get guidance from professionals who understand the work.</p></article><article><b>Career focused</b><p>Build skills, confidence and a profile employers can trust.</p></article></div>`);
    return;
  }
  if (routePage === "courses" && routePath === "/courses") {
    const response = await fetch("/api/courses");
    const courses = response.ok ? await response.json() : [];
    routeShell("Courses <em>that move careers.</em>", "Explore practical Tally, GST, tax and Excel programmes.", `<div class="route-course-grid">${courses.map((course) => `<article class="course-card route-course-card"><div class="course-icon orange">₮</div><span class="level">COURSE</span><h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description)}</p><div class="course-meta"><span>₹${(course.price || 0).toLocaleString("en-IN")}</span><span>▣ Practical</span></div><a class="course-link" href="/courses/${encodeURIComponent(course.slug)}">View course <span>→</span></a><button class="button button-small course-buy" data-course-id="${escapeHtml(course.slug)}">Buy now</button></article>`).join("")}</div>`);
    document.querySelectorAll(".route-course-card .course-buy").forEach((button) => button.addEventListener("click", () => startCoursePurchase(button.dataset.courseId)));
    return;
  }
  if (routePath.startsWith("/courses/")) {
    const slug = decodeURIComponent(routePath.split("/").pop());
    const response = await fetch(`/api/courses/${encodeURIComponent(slug)}`);
    if (!response.ok) return routeShell("Course not found", "This course is unavailable.", "");
    const course = await response.json();
    routeShell(`${escapeHtml(course.title)} <em>course.</em>`, escapeHtml(course.description), `<div class="route-detail-card"><div><h3>What you will learn</h3><ul class="check-list">${course.modules.flatMap((module) => module.topics).map((topic) => `<li><b>${escapeHtml(topic.title)}</b><span>Topic-wise practical training and study material</span></li>`).join("")}</ul></div><div class="syllabus-card"><h3>Course modules</h3>${course.modules.map((module) => `<div class="syllabus-row"><span>▣</span><div><b>${escapeHtml(module.title)}</b><small>${module.topics.length} topics</small></div></div>`).join("")}<div class="fees"><span>Course fee</span><b>₹${course.price.toLocaleString("en-IN")}</b></div><button class="button course-buy" data-course-id="${escapeHtml(course.slug)}">Buy now <span>→</span></button></div></div>`);
    document.querySelector(".route-detail-card .course-buy").addEventListener("click", () => startCoursePurchase(course.slug));
    return;
  }
  if (routePage === "student") {
    routeShell("Student <em>learning hub.</em>", "Manage your enrolled courses, progress and protected study material.", `<div class="dashboard-grid"><div class="dashboard-card"><h3>Dashboard</h3><p class="muted">Your learning progress and recent activity.</p><a class="button button-small" href="/student/my-courses">My courses →</a></div><div class="dashboard-card"><h3>Browse courses</h3><p class="muted">Explore available programmes and enroll.</p><a class="button button-small" href="/courses">View courses →</a></div><div class="dashboard-card"><h3>Resources</h3><p class="muted">Access free and enrolled study material.</p><a class="button button-small" href="/resources">View resources →</a></div></div>`);
    return;
  }
  if (routePage === "admin") {
    const token = localStorage.getItem("tally_auth_token");
    const response = token ? await fetch("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } }) : null;
    if (!response || !response.ok) {
      routeShell("Admin <em>login required.</em>", "Sign in with your administrator account to continue.", `<button class="button" data-open-modal="admin-login-modal">Open admin login <span>→</span></button>`);
      document.querySelector("[data-open-modal='admin-login-modal']").addEventListener("click", () => openModal("admin-login-modal"));
      return;
    }
    const stats = await response.json();
    routeShell("Admin <em>dashboard.</em>", "Manage your learning platform from one secure control centre.", `<div class="admin-route-actions"><a class="button button-small" href="/admin/courses">Manage courses</a><button class="button button-small" id="route-admin-logout" type="button">Log out</button></div><div class="admin-stats">${["courses", "students", "enrollments", "payments", "content"].map((key) => `<div class="admin-stat"><b>${stats[key]}</b><small>${key}</small></div>`).join("")}</div><section class="admin-student-panel"><div class="section-heading"><div><span class="kicker">Student directory</span><h2>Registered <em>students.</em></h2></div></div><div id="admin-student-list"><p class="muted">Loading students...</p></div></section><section class="admin-student-panel"><div class="section-heading"><div><span class="kicker">Course enrollment</span><h2>Who enrolled in <em>which course.</em></h2></div></div><div id="admin-enrollment-list"><p class="muted">Loading enrollments...</p></div></section><section class="admin-student-panel"><div class="section-heading"><div><span class="kicker">Payment records</span><h2>Complete <em>payment details.</em></h2></div></div><div id="admin-payment-list"><p class="muted">Loading payments...</p></div></section><div class="admin-panel-note">Use the protected admin APIs to manage courses, modules, topics, videos, PDFs, payments and enrollments.</div><section class="route-admin-pdfs" id="admin-pdfs"><div class="section-heading"><div><span class="kicker">Admin access</span><h2>Course PDFs, <em>always available.</em></h2></div><span class="access-note">✓ Admin access granted</span></div><div class="pdf-grid" id="pdf-material-list"><p class="muted">Loading study material...</p></div></section>`);
    document.getElementById("route-admin-logout").addEventListener("click", () => {
      localStorage.removeItem("tally_auth_token");
      window.location.href = "/";
    });
    await loadStudyMaterials();
    await loadAdminStudents();
    await loadAdminEnrollments();
    await loadAdminPayments();
  }
}

async function loadAdminStudents() {
  const list = document.getElementById("admin-student-list");
  const token = localStorage.getItem("tally_auth_token");
  if (!list || !token) return;
  const response = await fetch("/api/admin/students", { headers: { Authorization: "Bearer " + token } });
  if (!response.ok) {
    list.innerHTML = `<p class="muted">Unable to load student details.</p>`;
    return;
  }

  const students = await response.json();
  list.innerHTML = students.length ? `<div class="admin-student-table"><div class="admin-student-row admin-student-head"><b>Name</b><b>Email</b><b>Phone</b><b>Registered</b></div>${students.map((student) => `<div class="admin-student-row"><span>${escapeHtml(student.name)}</span><span>${escapeHtml(student.email)}</span><span>${escapeHtml(student.phone || "Not provided")}</span><span>${escapeHtml(new Date(student.created_at).toLocaleDateString("en-IN"))}</span></div>`).join("")}</div>` : `<p class="muted">No students registered yet.</p>`;
}

async function loadAdminEnrollments() {
  const list = document.getElementById("admin-enrollment-list");
  const token = localStorage.getItem("tally_auth_token");
  if (!list || !token) return;
  const response = await fetch("/api/admin/enrollments", { headers: { Authorization: "Bearer " + token } });
  if (!response.ok) { list.innerHTML = `<p class="muted">Unable to load enrollment details.</p>`; return; }
  const enrollments = await response.json();
  list.innerHTML = enrollments.length ? `<div class="admin-student-table"><div class="admin-student-row admin-student-head"><b>Student</b><b>Email</b><b>Phone</b><b>Course</b><b>Status</b></div>${enrollments.map(item => `<div class="admin-student-row admin-wide-row"><span>${escapeHtml(item.student_name)}</span><span>${escapeHtml(item.email)}</span><span>${escapeHtml(item.phone || "Not provided")}</span><span>${escapeHtml(item.course_title)}</span><span>${escapeHtml(item.status)}</span></div>`).join("")}</div>` : `<p class="muted">No enrollments yet.</p>`;
}

async function loadAdminPayments() {
  const list = document.getElementById("admin-payment-list");
  const token = localStorage.getItem("tally_auth_token");
  if (!list || !token) return;
  const response = await fetch("/api/admin/payments", { headers: { Authorization: "Bearer " + token } });
  if (!response.ok) { list.innerHTML = `<p class="muted">Unable to load payment details.</p>`; return; }
  const payments = await response.json();
  list.innerHTML = payments.length ? `<div class="admin-student-table"><div class="admin-student-row admin-student-head"><b>Student</b><b>Course</b><b>Amount</b><b>Status</b><b>Order / Payment ID</b><b>Date</b></div>${payments.map(item => `<div class="admin-student-row admin-payment-row"><span>${escapeHtml(item.student_name)}<small>${escapeHtml(item.email)}</small></span><span>${escapeHtml(item.title)}</span><span>₹${Number(item.amount || 0).toLocaleString("en-IN")}</span><span>${escapeHtml(item.status)}</span><span>${escapeHtml(item.razorpay_order_id || "Not created")}<small>${escapeHtml(item.razorpay_payment_id || "Payment pending")}</small></span><span>${escapeHtml(new Date(item.created_at).toLocaleString("en-IN"))}</span></div>`).join("")}</div>` : `<p class="muted">No payment records yet.</p>`;
}

window.addEventListener("popstate", renderRoute);
renderRoute();

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
}

function connectionError(error) {
  return isLocalFile || error instanceof TypeError
    ? "Backend is not running. Run npm install, then npm start, and open http://localhost:3000."
    : (error.message || "Unable to connect to the backend.");
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
}

document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openModal(trigger.dataset.openModal);
  });
});

document.querySelectorAll(".modal-close").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.closest(".modal")));
});

document.querySelector(".pdf-close-button")?.addEventListener("click", () => {
  closeModal(document.getElementById("pdf-modal"));
});

document.querySelectorAll(".password-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const input = toggle.parentElement.querySelector("input");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    toggle.textContent = visible ? "◉" : "◌";
    toggle.setAttribute("aria-label", visible ? "Show password" : "Hide password");
    toggle.setAttribute("aria-pressed", String(!visible));
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.querySelectorAll(".modal.open").forEach(closeModal);
});

document.querySelectorAll(".lead-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const modal = form.closest(".modal");
    if (form.id === "admin-login-form") {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: form.elements.identifier.value, password: form.elements.password.value })
        });
        if (!response.ok) throw new Error("Invalid admin credentials.");
        const result = await response.json();
        if (!result.user || result.user.role !== "admin") throw new Error("Administrator access required.");
        localStorage.setItem("tally_auth_token", result.token);
        closeModal(modal);
        window.location.href = "/admin/dashboard";
      } catch (error) {
        showToast(connectionError(error));
      }
      return;
    }
    if (modal && modal.id === "apply-modal") {
      const email = form.querySelector('input[type="email"]').value;
      const password = form.querySelector('input[type="password"]').value;
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error("Invalid email or password.");
        const result = await response.json();
        localStorage.setItem("tally_auth_token", result.token);
        closeModal(modal);
        showToast("Signed in successfully.");
        refreshDashboard();
        return;
      } catch (error) {
        showToast(connectionError(error));
        return;
      }
    }
    if (modal && modal.id === "register-modal") {
      const inputs = form.querySelectorAll("input");
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inputs[0].value, email: inputs[1].value, phone: inputs[2].value, password: inputs[3].value })
        });
        if (!response.ok) throw new Error("Unable to create profile.");
        const result = await response.json();
        if (result.token) localStorage.setItem("tally_auth_token", result.token);
        closeModal(modal);
        showToast("Profile created successfully.");
        refreshDashboard();
        return;
      } catch (error) {
        showToast(connectionError(error));
        return;
      }
    }
    closeModal(modal);
    form.reset();
    showToast("Thanks! Our team will be in touch shortly.");
  });
});

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  nav.classList.toggle("open", !expanded);
});
document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll(".video-thumb").forEach((video) => {
  video.addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.src = `${video.dataset.video}?autoplay=1`;
    frame.title = "Student testimonial video";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    frame.className = "video-frame";
    video.replaceWith(frame);
  });
});

document.querySelectorAll(".job-tabs button").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelector(".job-tabs .active").classList.remove("active");
    tab.classList.add("active");
    showToast(`${tab.textContent} jobs loaded`);
  });
});

let pdfObjectUrl;
async function loadStudyMaterials() {
  const list = document.getElementById("pdf-material-list");
  if (!list) return;
  try {
    const response = await fetch("/api/courses/tally-prime-gst");
    if (!response.ok) throw new Error("Study material unavailable");
    const course = await response.json();
    const providedNames = new Set([
      "Tally Prime Exercise 1.pdf",
      "Tally Prime Exercise-2.pdf",
      "Tally Prime Exercise 3.pdf",
      "Tally Prime Exercise 4.pdf",
      "Tally Prime Exercise 5.pdf"
    ]);
    const pdfs = course.modules.flatMap((module) => module.topics.flatMap((topic) =>
      topic.contents.filter((content) => content.type === "pdf").map((content) => ({ ...content, topic: topic.title }))
    )).filter((content) => providedNames.has(content.title)).sort((left, right) => {
      const number = name => Number((name.match(/(?:exercise[\s-]*)?(\d+)/i) || [0, 0])[1]);
      return number(left.title) - number(right.title);
    });
    const token = localStorage.getItem("tally_auth_token");
    let enrolled = false;
    if (token) {
      const userResponse = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (userResponse.ok) {
        const userResult = await userResponse.json();
        if (userResult.user.role === "admin") {
          enrolled = true;
        } else {
          const dashboardResponse = await fetch("/api/student/dashboard", { headers: { Authorization: `Bearer ${token}` } });
          if (dashboardResponse.ok) {
            const dashboard = await dashboardResponse.json();
            enrolled = dashboard.courses.some((item) => item.slug === "tally-prime-gst" && item.paid);
          }
        }
      }
    }
    list.innerHTML = pdfs.map((pdf) => `
      <article class="pdf-card ${enrolled ? "unlocked" : "locked"}">
        <span class="pdf-icon">▤</span>
        <h3>${escapeHtml(pdf.title)}</h3>
        <p>${escapeHtml(pdf.topic)}</p>
        <span class="pdf-status">${enrolled ? "✓ Access granted" : "🔒 Purchase to access"}</span>
        <div class="pdf-actions">
          <button data-pdf-id="${pdf.id}" data-pdf-action="read" ${enrolled ? "" : "disabled"}>Read PDF</button>
          <button data-pdf-id="${pdf.id}" data-pdf-action="download" ${enrolled ? "" : "disabled"}>Download</button>
        </div>
      </article>`).join("");
    list.querySelectorAll("[data-pdf-action]").forEach((button) => {
      button.addEventListener("click", () => openProtectedPdf(button.dataset.pdfId, button.dataset.pdfAction));
    });
  } catch (error) {
    const providedPdfs = [
      "Tally Prime Exercise 1.pdf",
      "Tally Prime Exercise-2.pdf",
      "Tally Prime Exercise 3.pdf",
      "Tally Prime Exercise 4.pdf",
      "Tally Prime Exercise 5.pdf"
    ].sort((left, right) => Number(left.match(/\d+/)[0]) - Number(right.match(/\d+/)[0]));
    list.innerHTML = providedPdfs.map((name) => `
      <article class="pdf-card locked">
        <span class="pdf-icon">▤</span><h3>${escapeHtml(name)}</h3>
        <p>Tally Prime + GST course material</p><span class="pdf-status">🔒 Purchase to access</span>
        <div class="pdf-actions"><button disabled>Read PDF</button><button disabled>Download</button></div>
      </article>`).join("");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

async function openProtectedPdf(contentId, action) {
  const token = localStorage.getItem("tally_auth_token");
  if (!token) {
    showToast("Purchase the course and sign in to access study material.");
    openModal("apply-modal");
    return;
  }
  try {
    const response = await fetch(`/api/my/content/${contentId}/stream`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Please log in again.");
      if (response.status === 403) throw new Error("This PDF is locked. Purchase the course to access it.");
      throw new Error("The PDF could not be opened. Please restart the backend and try again.");
    }
    const blob = await response.blob();
    if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
    pdfObjectUrl = URL.createObjectURL(blob);
    const disposition = response.headers.get("content-disposition") || "";
    const filenameMatch = disposition.match(/filename="([^"]+)"/);
    const filename = filenameMatch ? filenameMatch[1] : "study-material.pdf";
    if (action === "download") {
      const link = document.createElement("a");
      link.href = pdfObjectUrl;
      link.download = filename;
      link.click();
      return;
    }
    document.getElementById("pdf-viewer-title").textContent = filename;
    document.getElementById("pdf-viewer").src = pdfObjectUrl;
    document.getElementById("pdf-download").href = pdfObjectUrl;
    document.getElementById("pdf-download").download = filename;
    openModal("pdf-modal");
  } catch (error) {
    showToast(connectionError(error));
  }
}

async function startCoursePurchase(courseId) {
  const token = localStorage.getItem("tally_auth_token");
  if (!token) {
    showToast("Please sign in before purchasing a course.");
    openModal("apply-modal");
    return;
  }
  try {
    const response = await fetch("/api/payments/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId })
    });
    if (!response.ok) throw new Error("Unable to create payment order");
    const order = await response.json();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Tally With Tax",
        description: order.courseTitle,
        order_id: order.orderId,
        handler: async (payment) => {
          const verification = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payment)
          });
          if (!verification.ok) throw new Error("Payment verification failed");
          showToast("Payment successful. Your course is now unlocked.");
          refreshDashboard();
        },
        modal: { ondismiss: () => showToast("Payment cancelled. Your course remains locked.") }
      });
      checkout.open();
    };
    script.onerror = () => showToast("Razorpay checkout could not be loaded.");
    document.body.appendChild(script);
  } catch (error) {
    showToast(connectionError(error));
  }
}

document.querySelectorAll(".course-buy").forEach((button) => {
  button.addEventListener("click", () => startCoursePurchase(button.dataset.courseId));
});

async function refreshDashboard() {
  const token = localStorage.getItem("tally_auth_token");
  if (!token) return;
  try {
    const response = await fetch("/api/student/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return;
    const dashboard = await response.json();
    const currentCourse = dashboard.courses && dashboard.courses[0];
    if (dashboard.studentName && document.getElementById("dashboard-name")) document.getElementById("dashboard-name").textContent = dashboard.studentName;
    if (currentCourse) {
      const progressBar = document.getElementById("dashboard-progress-bar");
      const progressLabel = document.getElementById("dashboard-progress-label");
      if (progressBar) progressBar.style.width = `${currentCourse.progress || 0}%`;
      if (progressLabel) progressLabel.textContent = `${currentCourse.progress || 0}% complete`;
    }
  } catch (error) {
    console.warn("Dashboard refresh failed", error);
  }
}

document.getElementById("refresh-dashboard")?.addEventListener("click", refreshDashboard);
refreshDashboard();
loadStudyMaterials();
loadAdminDashboard();

async function loadAdminDashboard() {
  const token = localStorage.getItem("tally_auth_token");
  if (!token) return false;
  const response = await fetch("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    document.getElementById("admin-dashboard")?.setAttribute("hidden", "");
    return false;
  }
  const stats = await response.json();
  const dashboard = document.getElementById("admin-dashboard");
  const statsPanel = document.getElementById("admin-stats");
  if (!dashboard || !statsPanel) return false;
  dashboard.hidden = false;
  statsPanel.innerHTML = [
    ["courses", "Courses"], ["students", "Students"], ["enrollments", "Enrollments"], ["payments", "Payments"], ["content", "Content items"]
  ].map(([key, label]) => `<div class="admin-stat"><b>${stats[key]}</b><small>${label}</small></div>`).join("");
  return true;
}

document.getElementById("admin-logout")?.addEventListener("click", () => {
  localStorage.removeItem("tally_auth_token");
  document.getElementById("admin-dashboard").hidden = true;
  window.location.hash = "top";
  showToast("Admin logged out.");
});
