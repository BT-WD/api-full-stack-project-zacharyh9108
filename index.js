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

    document.getElementById('sprite').src =
      data.sprites.front_default || "";

    // Stats
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = "<strong>STATS</strong><br>";

    data.stats.forEach(stat => {
      const value = Math.floor(stat.base_stat / 10);
      statsDiv.innerHTML +=
        `${stat.stat.name.toUpperCase()}: ${"█".repeat(value)}<br>`;
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
  }
}