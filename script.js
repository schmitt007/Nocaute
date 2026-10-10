const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");

const themeToggle = document.querySelector("[data-theme-toggle]");
const themeIcon = document.querySelector("[data-theme-icon]");
const themeColor = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";

  if (themeToggle) {
    const label = isDark ? "Ativar modo claro" : "Ativar modo escuro";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute("aria-pressed", String(isDark));
  }
  if (themeIcon) {
    themeIcon.textContent = isDark ? "☀" : "☾";
  }
  if (themeColor) {
    themeColor.content = isDark ? "#141414" : "#f4f3f0";
  }
}

if (themeToggle) {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      localStorage.setItem("nocaute-theme", nextTheme);
    } catch (error) {
      console.warn("Não foi possível salvar a preferência de tema neste navegador.", error);
    }
  });
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menu" : "Fechar menu");
    mainNav.classList.toggle("is-open", !isExpanded);
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
      mainNav.classList.remove("is-open");
    });
  });
}

const modalityDialog = document.querySelector("[data-modality-dialog]");
const dialogTitle = document.querySelector("[data-dialog-title]");
const dialogDescription = document.querySelector("[data-dialog-description]");
const dialogPoints = document.querySelector("[data-dialog-points]");
const dialogCta = document.querySelector("[data-dialog-cta]");

const modalityDetails = {
  boxe: {
    name: "Boxe",
    description:
      "Uma modalidade de luta que combina técnica, movimentação e condicionamento. As aulas ajudam você a desenvolver coordenação, foco e confiança, sempre com orientação da equipe.",
    points: ["Aprenda fundamentos e combinações de golpes.", "Trabalhe movimentação, ritmo e preparo físico.", "Consulte a equipe para saber como funciona a aula."],
  },
  "muay-thai": {
    name: "Muay Thai",
    description:
      "Uma arte marcial dinâmica que trabalha técnicas de ataque e defesa, movimentação e resistência. Você aprende passo a passo, com acompanhamento durante o treino.",
    points: ["Pratique fundamentos técnicos da modalidade.", "Desenvolva ritmo, coordenação e condicionamento.", "Fale com o CT para encontrar a turma adequada."],
  },
  "personal-fight": {
    name: "Personal Fight",
    description:
      "Um treino de luta com atenção personalizada, pensado para acompanhar seus objetivos e seu ritmo. Converse com a equipe para entender o formato das sessões e combinar os detalhes.",
    points: ["Acompanhamento mais individual durante o treino.", "Conte à equipe quais são seus objetivos.", "Horários e formato são combinados diretamente com o CT."],
  },
};

if (
  modalityDialog instanceof HTMLDialogElement &&
  dialogTitle &&
  dialogDescription &&
  dialogPoints &&
  dialogCta
) {
  document.querySelectorAll("[data-modality]").forEach((button) => {
    button.addEventListener("click", () => {
      const details = modalityDetails[button.dataset.modality];
      if (!details) return;

      dialogTitle.textContent = details.name;
      dialogDescription.textContent = details.description;
      dialogPoints.replaceChildren(
        ...details.points.map((point) => {
          const item = document.createElement("li");
          item.textContent = point;
          return item;
        }),
      );
      dialogCta.href = `/contato.html?modalidade=${encodeURIComponent(details.name)}`;
      modalityDialog.showModal();
    });
  });

  modalityDialog.querySelector("[data-dialog-close]")?.addEventListener("click", () => {
    modalityDialog.close();
  });

  modalityDialog.addEventListener("click", (event) => {
    if (event.target === modalityDialog) modalityDialog.close();
  });
}

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealItems = document.querySelectorAll(
    ".value-card, .class-card, .home-page-card, .schedule-heading, .weekly-schedule, .pricing-heading, .pricing-table-wrap, .contact-page-copy, .contact-page-form",
  );

  if (revealItems.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );

    revealItems.forEach((item) => {
      item.classList.add("reveal-on-scroll");
      revealObserver.observe(item);
    });
  }
}

const currentYear = document.querySelector("[data-year]");
if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const submitButton = contactForm?.querySelector('button[type="submit"]');

if (contactForm) {
  const selectedModality = new URLSearchParams(window.location.search).get("modalidade");
  const modalitySelect = contactForm.elements.namedItem("className");
  if (
    selectedModality &&
    modalitySelect instanceof HTMLSelectElement &&
    Array.from(modalitySelect.options).some((option) => option.value === selectedModality)
  ) {
    modalitySelect.value = selectedModality;
  }
}

if (contactForm && formStatus && submitButton) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.textContent = "";
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");

    try {
      const formData = new FormData(contactForm);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível enviar seus dados.");
      }

      contactForm.reset();
      formStatus.textContent = "Contato enviado! A equipe do Nocaute falará com você.";
    } catch (error) {
      formStatus.textContent =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar seus dados. Tente novamente.";
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
    }
  });
}

const whatsappButton = document.querySelector("[data-whatsapp]");
if (whatsappButton) {
  fetch("/api/config")
    .then((response) => {
      if (!response.ok) throw new Error("Não foi possível carregar as configurações de contato.");
      return response.json();
    })
    .then(({ whatsappNumber }) => {
      if (!whatsappNumber) return;
      const message = encodeURIComponent(
        "Oi! Quero conhecer o CT Nocaute e saber mais sobre os treinos.",
      );
      whatsappButton.href = `https://wa.me/${whatsappNumber}?text=${message}`;
      whatsappButton.hidden = false;
    })
    .catch((error) => {
      console.error("Falha ao carregar o WhatsApp do CT:", error);
    });
}
