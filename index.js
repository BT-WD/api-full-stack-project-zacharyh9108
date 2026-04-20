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

document.getElementById('searchInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    searchPokemon();
  }
});