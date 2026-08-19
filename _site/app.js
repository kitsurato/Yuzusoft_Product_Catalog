const data = window.CATALOG_DATA;

const state = {
  activeWork: data.works[0],
  activeProduct: "all",
  query: "",
};

const els = {
  workCount: document.querySelector("#workCount"),
  imageCount: document.querySelector("#imageCount"),
  workIndex: document.querySelector("#workIndex"),
  activeWork: document.querySelector("#activeWork"),
  productTabs: document.querySelector("#productTabs"),
  gallery: document.querySelector("#gallery"),
  search: document.querySelector("#searchInput"),
  viewer: document.querySelector("#viewer"),
  viewerImage: document.querySelector("#viewerImage"),
  viewerCaption: document.querySelector("#viewerCaption"),
  closeViewer: document.querySelector("#closeViewer"),
};

function imageMatches(image, product, work) {
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  return [image.name, image.work || "", product.code, product.title, work.code, work.title]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function filteredImagesFor(work, product) {
  return product.images.filter((image) => imageMatches(image, product, work));
}

function countVisibleImages(work) {
  return work.products.reduce((sum, product) => sum + filteredImagesFor(work, product).length, 0);
}

function logoMarkup(work, large = false) {
  const src = work.logo || work.fallbackImage;
  const className = large ? "active-logo" : "logo-frame";
  if (!src) return `<span class="${className}"><span class="logo-fallback">${work.code}</span></span>`;
  return `<span class="${className}"><img src="${src}" alt="${work.title}"></span>`;
}

function renderIndex() {
  els.workCount.textContent = `${Math.max(data.works.length - 1, 0)} works`;
  els.imageCount.textContent = `${data.totalImages} images`;
  els.workIndex.innerHTML = "";

  for (const work of data.works) {
    const visibleCount = countVisibleImages(work);
    if (state.query && visibleCount === 0) continue;

    const button = document.createElement("button");
    button.className = `work-card${work === state.activeWork ? " active" : ""}`;
    button.innerHTML = `
      ${logoMarkup(work)}
      <span>
        <span class="work-name">${work.title}</span>
        <span class="work-meta">${visibleCount || work.imageCount} images</span>
      </span>
    `;
    button.addEventListener("click", () => {
      state.activeWork = work;
      state.activeProduct = "all";
      render();
    });
    els.workIndex.appendChild(button);
  }
}

function renderActiveWork() {
  const work = state.activeWork;
  els.activeWork.innerHTML = `
    ${logoMarkup(work, true)}
    <div class="active-title">
      <h2>${work.title}</h2>
    </div>
  `;
}

function renderTabs() {
  const work = state.activeWork;
  const allCount = countVisibleImages(work);
  const visibleProducts = work.products
    .map((product) => ({
      ...product,
      visibleCount: filteredImagesFor(work, product).length,
    }))
    .filter((product) => product.visibleCount > 0);
  const activeProductVisible = state.activeProduct === "all"
    || visibleProducts.some((product) => product.code === state.activeProduct);
  if (!activeProductVisible) {
    state.activeProduct = "all";
  }

  const tabs = allCount > 0
    ? [{ code: "all", title: "全部", visibleCount: allCount }, ...visibleProducts]
    : [];
  els.productTabs.innerHTML = "";

  for (const product of tabs) {
    const button = document.createElement("button");
    button.className = `tab${state.activeProduct === product.code ? " active" : ""}`;
    button.textContent = `${product.title} ${product.visibleCount}`;
    button.addEventListener("click", () => {
      state.activeProduct = product.code;
      renderTabs();
      renderGallery();
    });
    els.productTabs.appendChild(button);
  }
}

function openViewer(image) {
  els.viewerImage.src = image.src;
  els.viewerImage.alt = image.name;
  els.viewerCaption.textContent = image.name;
  els.viewer.showModal();
}

function renderGallery() {
  const work = state.activeWork;
  const products = state.activeProduct === "all"
    ? work.products
    : work.products.filter((product) => product.code === state.activeProduct);
  els.gallery.innerHTML = "";

  let rendered = 0;
  for (const product of products) {
    const images = filteredImagesFor(work, product);
    if (!images.length) continue;

    const title = document.createElement("h3");
    title.className = "section-title";
    title.textContent = `${product.title} · ${images.length}`;
    els.gallery.appendChild(title);

    for (const image of images) {
      const card = document.createElement("article");
      card.className = "image-card";
      card.innerHTML = `
        <img loading="lazy" src="${image.src}" alt="${image.name}">
      `;
      card.addEventListener("click", () => openViewer(image));
      els.gallery.appendChild(card);
      rendered += 1;
    }
  }

  if (!rendered) {
    els.gallery.innerHTML = `<div class="empty">没有匹配的图片</div>`;
  }
}

function render() {
  if (state.query && countVisibleImages(state.activeWork) === 0) {
    state.activeWork = data.works.find((work) => countVisibleImages(work) > 0) || data.works[0];
    state.activeProduct = "all";
  }
  renderIndex();
  renderActiveWork();
  renderTabs();
  renderGallery();
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  state.activeProduct = "all";
  render();
});

els.closeViewer.addEventListener("click", () => els.viewer.close());
els.viewer.addEventListener("click", (event) => {
  if (event.target === els.viewer) els.viewer.close();
});

render();
