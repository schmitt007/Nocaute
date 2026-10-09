try {
  const savedTheme = localStorage.getItem("nocaute-theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    document.documentElement.dataset.theme = savedTheme;
  }
} catch {
  console.warn("Não foi possível ler a preferência de tema; usando o modo claro.");
}
