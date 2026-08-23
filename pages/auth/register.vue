<script setup lang="ts">
const supabase = useSupabaseClient()
const pseudo = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const modalMessage = ref('')
const modalType = ref<'error' | 'information'>('error')
const openModal = ref(false)
const loading = ref(false)
const emailOtp = ref('')
const verificationPending = ref(false)

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const CONTACT_EMAIL = 'informatique@mnl-syndicat.fr'

const friendlyAuthError = (error: {message?: string, status?: number}) => {
  const message = (error.message ?? '').toLowerCase()
  if (message.includes('email not linked to membership')) {
    return `Aucune adhésion n'a été trouvée pour cette adresse email. Vérifiez que vous utilisez bien l'email renseignée lors de votre adhésion, sinon contactez-nous à ${CONTACT_EMAIL}.`
  }
  if (message.includes('already registered')) {
    return 'Un compte existe déjà avec cette adresse email. Connectez-vous ou réinitialisez votre mot de passe.'
  }
  if (message.includes('rate limit') || error.status === 429) {
    return 'Trop de tentatives. Veuillez réessayer dans quelques minutes.'
  }
  if ((error.status !== undefined && error.status >= 500) || message.includes('database error')) {
    return `Une erreur est survenue côté serveur. Veuillez réessayer dans quelques instants, sinon contactez-nous à ${CONTACT_EMAIL}.`
  }
  return error.message || 'Une erreur est survenue. Veuillez réessayer.'
}

const friendlyOtpError = (error: {message?: string}) => {
  const message = (error.message ?? '').toLowerCase()
  if (message.includes('invalid') || message.includes('expired')) {
    return 'Ce code de vérification est invalide ou a expiré. Vérifiez votre boîte mail et réessayez.'
  }
  return error.message || 'Une erreur est survenue. Veuillez réessayer.'
}

const register = async () => {
  loading.value = true

  if (!pseudo.value || !email.value || !password.value) {
    modalMessage.value = "Veuillez remplir tous les champs."
    modalType.value = "error"
    openModal.value = true
    loading.value = false
    return
  }

  if (password.value.length < 8) {
    modalMessage.value = "Le mot de passe doit contenir au moins 8 caractères."
    modalType.value = "error"
    openModal.value = true
    loading.value = false
    return
  }

  if (!PASSWORD_REGEX.test(password.value)) {
    modalMessage.value = "Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial, et doit contenir au moins 8 caractères."
    modalType.value = "error"
    openModal.value = true
    loading.value = false
    return
  }

  if (email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) === null) {
    modalMessage.value = "Veuillez entrer une adresse email valide."
    modalType.value = "error"
    openModal.value = true
    loading.value = false
    return
  }

  const {error} = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {data: {pseudo: pseudo.value}}
  })

  loading.value = false
  if (error) {
    modalMessage.value = friendlyAuthError(error)
    modalType.value = "error"
    openModal.value = true
  } else {
    modalMessage.value = "Un email de vérification vous a été envoyé. Veuillez le confirmer pour continuer."
    modalType.value = "information"
    openModal.value = true
    verificationPending.value = true
  }
}

const confirmEmail = async () => {
  const {error} = await supabase.auth.verifyOtp({
    email: email.value,
    token: emailOtp.value,
    type: "email"
  })

  if (error) {
    modalMessage.value = friendlyOtpError(error)
    modalType.value = "error"
    openModal.value = true
    return
  }

  navigateTo("/interne")
}

useHead({
  title: 'Créer un compte — MNL',
  meta: [
    {name: 'description', content: 'Création de compte sur le site du Mouvement National Lycéen'},
    {name: 'og:title', content: 'Créer un compte — Mouvement National Lycéen'},
    {name: 'og:description', content: 'Création de compte sur le site du Mouvement National Lycéen'},
  ],
})
</script>

<template>
  <top-bar/>
  <section>
    <h1>Créer votre compte</h1>
    <div class="authForm">
      <p>
        Cet espace est réservé aux adhérents du MNL. Pour créer votre compte, utilisez l'email que vous avez fourni lors de votre adhésion. Pour toute question, contactez-nous à <a href="mailto:informatique@mnl-syndicat.fr">informatique@mnl-syndicat.fr</a>.
      </p>
      <modal v-if="openModal" :type="modalType" :message="modalMessage" @close="openModal = false" />
      <label for="pseudo" >
        <Icon name="ph:user-bold"/>
        Pseudo</label>
      <input v-model="pseudo" type="text" :disabled="verificationPending"/>
      <label for="email">
        <Icon name="ph:envelope-simple-bold"/>
        Email</label>
      <input v-model="email" type="email" :disabled="verificationPending"/>
      <label for="passwordConfirmation">
        <Icon name="ph:lock-bold"/>
        Mot de passe</label>
      <div class="input-with-icon">
        <input v-model="password" :type="showPassword ? 'text' : 'password'" :disabled="verificationPending"/>
        <Icon :name="showPassword ? 'ph:eye-slash-bold' : 'ph:eye-bold'" @click="showPassword = !showPassword"/>
      </div>

      <label for="otp" v-if="verificationPending">
        <Icon name="ph:key-bold"/>
        Code de vérification</label>
      <input v-model="emailOtp" type="text" v-if="verificationPending"/>
      <btn @click="confirmEmail" label="Confirmer l'email" icon="ph:check-bold" v-if="verificationPending && !loading"/>
      <btn @click="register" label="Créer mon compte" icon="ph:sign-in-bold" v-if="!verificationPending && !loading"/>
      <btn label="Chargement..." icon="ph:hourglass-bold" v-if="loading"/>
    </div>
  </section>
</template>
