<script setup lang="ts">
import FederationsMap from '~/static/img/federations.svg';

const searchTerm = ref('');
const federations = getFederations();

function levenshteinDistance(a: string, b: string) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

const filteredFederations = computed(() => {
  if (!searchTerm.value) return federations;
  return federations.filter(federation => {
    // Check if the Levenshtein distance between the search term and federation name is less than or equal to 2
    return levenshteinDistance(searchTerm.value.toLowerCase(), (federation.code + federation.name.toLowerCase().slice(0, searchTerm.value.length))) <= 2;
  });
});

onMounted(() => {
  for (const federation of federations) {
    if (federation.active) {
      document.querySelector('.departement' + federation.code.toLowerCase())!.classList.add('active');

      document.querySelector('.departement' + federation.code.toLowerCase())!.addEventListener('click', () => {
        navigateTo('/federation/' + federation.code);
      });
    }
  }
});

useHead({
  title: 'Fédérations — MNL',
  meta: [
    {name: 'description', content: 'Retrouvez toutes les fédérations du Mouvement National Lycéen'},
    {name: 'og:title', content: 'Fédérations — Mouvement National Lycéen'},
    {name: 'og:description', content: 'Retrouvez toutes les fédérations du Mouvement National Lycéen'},
  ],
});
</script>

<template>
  <top-bar current-tab="/federations" />
  <section class="federations" >
    <h1>FÉDÉRATIONS</h1>
    <main>
      <div class="federation-list-wrapper">
        <div class="searchBar">
          <input type="text" v-model="searchTerm" placeholder="Hautes-Alpes">
          <Icon name="mdi:search" />
        </div>

        <div class="federation-list">
          <div v-for="federation in filteredFederations" :key="federation.code" class="federation">
            <NuxtLink :href="'/federation/' + federation.code">{{ federation.code }} {{ federation.name }}</NuxtLink>
          </div>
        </div>
      </div>

      <FederationsMap />
    </main>
  </section>
</template>

<style lang="scss">
@import 'static/scss/base.scss';

.federations main {
  display: flex;
  gap: 50px;
  align-items: flex-start;
  width: 80vw;
  justify-content: space-evenly;
}

.federation-list-wrapper {
  background: var(--surface-background-color);
  @include main-border;
  padding: 20px;
  border-radius: 3px;
  width: 30%;
  height: 60vh;
  display: flex;
  flex-direction: column;

  .federation-list {
    overflow-y: auto;
    padding-left: 10px;
  }

  .searchBar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--main-cta-color);
    padding: 10px;

    input {
      border: none;
      font-size: 20px;
      font-weight: 600;
      width: 100%;
      outline: none;
      padding: 0 !important;
    }

    .icon {
      width: 24px;
      height: 24px;
    }
  }

  .federation {
    margin: 10px 0;
    cursor: pointer;
    font-size: 20px;
    font-weight: 600;

    a {
      transition: all 0.1s;

      &:hover {
        color: var(--darker-cta-color);
        font-weight: 800;
      }
    }
  }
}

.federations svg.nuxt-icon {
  height: 60vh;
  width: auto;

  path {
    fill: var(--lighter-cta-color) !important;
    transform: scale(1);
    transform-origin: 50% 50%;
    transition:.3s;
    transform-box: fill-box;
    stroke: #FFF;
    stroke-width: 1px;


    &.active {
      fill: var(--main-cta-color) !important;
      cursor: pointer;
      transition: all 0.1s;

      &:hover {
        fill: var(--darker-cta-color) !important;
        transform: scale(1.05);
      }
    }
  }
}

@media (max-width: 768px) {
  .federations main {
    flex-direction: column;
    gap: 20px;
    width: 90vw;
  }

  .federation-list-wrapper {
    width: 100%;
    height: 50vh;
  }

  .federations svg {
    display: none;
  }
}
</style>