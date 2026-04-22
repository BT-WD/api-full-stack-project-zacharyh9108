async function searchPokemon() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();

  // Handle empty input
  if (!query) {
    alert("Please enter a Pokémon name or ID");
    return;
  }

  try {
    console.log("Searching for:", query);

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

    // Handle bad response
    if (!res.ok) {
      throw new Error("Pokémon not found");
    }

    const data = await res.json();
    console.log("Fetched Pokémon data:", data);

    // Basic Info
    document.getElementById('name').innerText =
      "NAME: " + data.name.toUpperCase();

    document.getElementById('type').innerText =
      "TYPE: " + data.types.map(t => t.type.name.toUpperCase()).join(', ');

    document.getElementById('ability').innerText =
      "ABILITY: " + data.abilities.map(a => a.ability.name.toUpperCase()).join(', ');

    const spriteEl = document.getElementById('sprite');
    // prefer official artwork, then front_default, else empty
    const officialArt = data.sprites && data.sprites.other && data.sprites.other['official-artwork'] && data.sprites.other['official-artwork'].front_default;
    spriteEl.src = officialArt || (data.sprites && data.sprites.front_default) || '';
    spriteEl.alt = data.name ? data.name : 'pokemon sprite';
    // subtle fade-in for a polished feel
    spriteEl.style.opacity = '0';
    spriteEl.style.transition = 'opacity 300ms ease';
    requestAnimationFrame(() => { spriteEl.style.opacity = '1'; });

    // Apply type theme to screen (supports many types)
    const screenEl = document.querySelector('.screen');
    if (screenEl) {
      // list of supported type classes
      const supported = [
        'type-fire','type-water','type-grass','type-electric','type-psychic',
        'type-rock','type-ground','type-flying','type-bug','type-poison',
        'type-dragon','type-ice','type-normal','type-fairy','type-ghost','type-steel'
      ];

      // remove any previous type classes
      screenEl.classList.remove(...supported);

      const primaryType = data.types && data.types.length ? data.types[0].type.name.toLowerCase() : '';
      const candidate = 'type-' + primaryType;
      if (supported.includes(candidate)) {
        screenEl.classList.add(candidate);
      }
    }

    // Stats
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = "<strong>STATS</strong>";

    // Use progress bars for each stat (animated fill). Scale base_stat to a 0-150 range for percent.
    data.stats.forEach(stat => {
      const base = stat.base_stat;
      const percent = Math.min(100, Math.round((base / 150) * 100));

      const row = document.createElement('div');
      row.className = 'stat';

      const label = document.createElement('div');
      label.className = 'stat-label';
      label.innerText = stat.stat.name.toUpperCase();

      const bar = document.createElement('div');
      bar.className = 'stat-bar';

      const fill = document.createElement('div');
      fill.className = 'stat-fill';
      fill.setAttribute('role', 'progressbar');
      fill.setAttribute('aria-valuemin', '0');
      fill.setAttribute('aria-valuemax', '150');
      fill.setAttribute('aria-valuenow', String(base));
      // set width to 0 first so CSS transition animates
      fill.style.width = '0%';

      const value = document.createElement('div');
      value.className = 'stat-value';
      value.innerText = base;

      bar.appendChild(fill);
      row.appendChild(label);
      row.appendChild(bar);
      row.appendChild(value);
      statsDiv.appendChild(row);

      // Trigger the animated fill on the next frame
      requestAnimationFrame(() => {
        fill.style.width = percent + '%';
      });
    });

    // Evolution Chain
    const speciesRes = await fetch(data.species.url);

    if (!speciesRes.ok) {
      throw new Error("Failed to fetch species data");
    }

    const speciesData = await speciesRes.json();

    const evoRes = await fetch(speciesData.evolution_chain.url);

    if (!evoRes.ok) {
      throw new Error("Failed to fetch evolution chain");
    }

    const evoData = await evoRes.json();

    let chain = [];
    let evo = evoData.chain;

    // Traverse evolution chain safely
    while (evo) {
      chain.push(evo.species.name.toUpperCase());
      evo = evo.evolves_to && evo.evolves_to.length > 0
        ? evo.evolves_to[0]
        : null;
    }

    document.getElementById('evolution').innerText =
      "EVOLUTION: " + chain.join(" → ");

    // Favorites logic
    updateFavButton(data.name);

  } catch (err) {
    console.error("Error fetching Pokémon:", err);

    alert("Pokémon not found or API error!");

    // Reset UI on error
    document.getElementById('name').innerText = "NAME: ---";
    document.getElementById('type').innerText = "TYPE: ---";
    document.getElementById('ability').innerText = "ABILITY: ---";
    document.getElementById('sprite').src = "";
    document.getElementById('stats').innerHTML = "";
    document.getElementById('evolution').innerText = "";

    // Remove any applied type theme
    const screenEl = document.querySelector('.screen');
    if (screenEl) screenEl.classList.remove('type-fire', 'type-water', 'type-grass');
  }
}

// Favorites utility
const FAV_KEY = 'pokedex_favorites_v1';
function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveFavorites(list) { localStorage.setItem(FAV_KEY, JSON.stringify(list)); }

function isFavorited(name) {
  const favs = loadFavorites();
  return favs.some(f => f.name === name);
}

function updateFavButton(name) {
  const btn = document.getElementById('favBtn');
  if (!btn) return;
  if (isFavorited(name)) { btn.innerText = '★'; btn.title = 'Remove from favorites'; }
  else { btn.innerText = '☆'; btn.title = 'Save to favorites'; }
}

function toggleFavorite(current) {
  if (!current || !current.name) return;
  const favs = loadFavorites();
  const idx = favs.findIndex(f => f.name === current.name);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    // store minimal info
    favs.push({ name: current.name, sprite: current.sprite, types: current.types });
  }
  saveFavorites(favs);
  updateFavButton(current.name);
  renderFavorites();
}

function renderFavorites() {
  const view = document.getElementById('favoritesView');
  if (!view) return;
  const favs = loadFavorites();
  if (!favs.length) {
    view.innerHTML = '<em>No favorites yet</em>';
    return;
  }
  const list = document.createElement('div');
  list.className = 'fav-list';
  favs.forEach(f => {
    const it = document.createElement('div');
    it.className = 'fav-item';
    it.innerHTML = `<img src="${f.sprite}" alt="${f.name}"><div>${f.name.toUpperCase()}</div>`;
    it.addEventListener('click', () => {
      document.getElementById('searchInput').value = f.name;
      searchPokemon();
    });
    list.appendChild(it);
  });
  view.innerHTML = '';
  view.appendChild(list);
}

// Wire favorites UI
document.addEventListener('DOMContentLoaded', () => {
  const favBtn = document.getElementById('favBtn');
  const showFavsBtn = document.getElementById('showFavsBtn');
  if (favBtn) favBtn.addEventListener('click', () => {
    // read current displayed name
    const nameEl = document.getElementById('name');
    const typeEl = document.getElementById('type');
    const spriteEl = document.getElementById('sprite');
    const currentName = nameEl && nameEl.innerText.replace('NAME: ', '').toLowerCase();
    const currentTypes = typeEl && typeEl.innerText.replace('TYPE: ', '').split(',').map(s => s.trim().toLowerCase());
    toggleFavorite({ name: currentName, sprite: spriteEl.src, types: currentTypes });
  });

  if (showFavsBtn) showFavsBtn.addEventListener('click', () => {
    const view = document.getElementById('favoritesView');
    if (!view) return;
    view.classList.toggle('hidden');
    if (!view.classList.contains('hidden')) renderFavorites();
  });

  renderFavorites();
});

document.getElementById('searchInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    searchPokemon();
  }
});