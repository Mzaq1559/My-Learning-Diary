---
title: "Vue.js : A Practical Intermediate Guide to Reactive UI Development"
slug: vuejs-a-practical-intermediate-guide-to-reactive-ui-development
date: 2026-04-24
tags: [Vue, Vue3, JavaScript, Frontend, Composition API, Pinia]
category: web-development
---

# Vue.js : A Practical Intermediate Guide to Reactive UI Development

Vue.js is the most approachable of the major JavaScript frameworks, but it is far from simple. Vue 3, released in 2020, introduced the Composition API, a new reactivity system based on Proxy, and first-class TypeScript support — transforming it into a powerful tool for building complex applications. This guide covers Vue 3's core concepts and the patterns you need to go beyond the basics.

---

## 1. Single File Components (SFCs)

Vue's SFC format keeps template, script, and styles co-located in a single `.vue` file — a defining feature of the Vue developer experience:

```vue
<!-- UserCard.vue -->
<template>
  <div class="user-card" :class="{ highlighted: isHighlighted }">
    <img :src="user.avatar" :alt="user.name" />
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
    <button @click="$emit('select', user.id)">Select</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  user: { id: number; name: string; email: string; avatar: string };
  isHighlighted?: boolean;
}>();

defineEmits<{
  select: [id: number];
}>();
</script>

<style scoped>
.user-card {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.highlighted {
  border-color: #3b82f6;
}
</style>
```

---

## 2. The Composition API

The Composition API organizes code by feature rather than by option type (data, methods, computed), making complex components far easier to understand and refactor.

### 2.1 ref and reactive

```vue
<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';

// ref — for primitives and single values
const count = ref(0);
const name = ref('Muhammad');

// reactive — for objects
const user = reactive({
  id: 1,
  name: 'Muhammad',
  role: 'Engineer',
});

// computed — derived state
const greeting = computed(() => `Hello, ${user.name}!`);
const isAdmin = computed(() => user.role === 'Admin');

// Mutate ref with .value (in script); template unwraps automatically
function increment() {
  count.value++;
}

// Mutate reactive directly
function updateRole(newRole: string) {
  user.role = newRole;
}

// watch — side effects on reactive state changes
watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`);
});

// watchEffect — runs immediately and tracks dependencies automatically
watchEffect(() => {
  console.log('User name is now:', user.name);
});
</script>

<template>
  <div>
    <p>{{ greeting }}</p>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
    <span v-if="isAdmin">🔑 Admin</span>
  </div>
</template>
```

### 2.2 Composables (Vue's Custom Hooks)

Composables are functions that encapsulate and reuse stateful logic — Vue's equivalent of React's custom hooks:

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue';

export function useCounter(initialValue = 0, step = 1) {
  const count = ref(initialValue);

  const doubled = computed(() => count.value * 2);

  function increment() { count.value += step; }
  function decrement() { count.value -= step; }
  function reset() { count.value = initialValue; }

  return { count, doubled, increment, decrement, reset };
}

// composables/useFetch.ts
import { ref, watchEffect } from 'vue';

export function useFetch<T>(url: string) {
  const data = ref<T | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(true);

  watchEffect(async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data.value = await res.json();
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  });

  return { data, error, loading };
}
```

```vue
<!-- Using composables -->
<script setup lang="ts">
import { useCounter } from '@/composables/useCounter';
import { useFetch } from '@/composables/useFetch';

const { count, doubled, increment, decrement, reset } = useCounter(0, 5);
const { data: posts, loading, error } = useFetch<Post[]>('/api/posts');
</script>

<template>
  <div>
    <p>Count: {{ count }} (doubled: {{ doubled }})</p>
    <button @click="increment">+5</button>
    <button @click="decrement">-5</button>
    <button @click="reset">Reset</button>

    <div v-if="loading">Loading posts...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <ul v-else>
      <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
    </ul>
  </div>
</template>
```

---

## 3. Template Directives

```vue
<template>
  <!-- v-if / v-else-if / v-else -->
  <div v-if="status === 'active'">Active</div>
  <div v-else-if="status === 'pending'">Pending</div>
  <div v-else>Inactive</div>

  <!-- v-show — toggles CSS display (element stays in DOM) -->
  <div v-show="isVisible">Always rendered, conditionally shown</div>

  <!-- v-for with key -->
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>

  <!-- v-for with index -->
  <ol>
    <li v-for="(item, index) in items" :key="item.id">
      {{ index + 1 }}. {{ item.name }}
    </li>
  </ol>

  <!-- v-model — two-way binding -->
  <input v-model="searchQuery" placeholder="Search..." />
  <input v-model.trim="username" />
  <input v-model.number="age" type="number" />

  <!-- v-bind shorthand — dynamic attributes -->
  <img :src="imageUrl" :alt="imageAlt" />

  <!-- v-on shorthand — events -->
  <button @click="handleClick">Click</button>
  <input @keyup.enter="submit" @keyup.esc="cancel" />
</template>
```

---

## 4. Props and Emits

### With TypeScript (Recommended)

```vue
<!-- ChildComponent.vue -->
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
  items: string[];
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

const emit = defineEmits<{
  update: [value: string];
  close: [];
}>();

function handleUpdate(val: string) {
  emit('update', val);
}
</script>
```

### v-model on Custom Components

```vue
<!-- CustomInput.vue -->
<script setup lang="ts">
defineProps<{ modelValue: string }>();
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    class="custom-input"
  />
</template>

<!-- Parent usage: -->
<!-- <CustomInput v-model="searchQuery" /> -->
```

---

## 5. Lifecycle Hooks

```vue
<script setup lang="ts">
import {
  onMounted, onUpdated, onUnmounted,
  onBeforeMount, onBeforeUpdate, onBeforeUnmount
} from 'vue';

onBeforeMount(() => console.log('Before DOM is created'));
onMounted(() => {
  console.log('DOM is ready — good place for API calls or DOM access');
  // Example: initialize a third-party library
});

onBeforeUpdate(() => console.log('Before DOM update'));
onUpdated(() => console.log('DOM updated'));

onBeforeUnmount(() => console.log('Before cleanup'));
onUnmounted(() => {
  console.log('Cleanup here — clear timers, remove listeners');
});
</script>
```

---

## 6. Pinia — State Management

Pinia is Vue's official state management library. It is simpler and more TypeScript-friendly than Vuex.

```typescript
// stores/useUserStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null);
  const users = ref<User[]>([]);
  const loading = ref(false);

  // Getters
  const isLoggedIn = computed(() => currentUser.value !== null);
  const adminUsers = computed(() => users.value.filter((u) => u.role === 'admin'));

  // Actions
  async function fetchUsers() {
    loading.value = true;
    try {
      const res = await fetch('/api/users');
      users.value = await res.json();
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    currentUser.value = await res.json();
  }

  function logout() {
    currentUser.value = null;
  }

  return { currentUser, users, loading, isLoggedIn, adminUsers, fetchUsers, login, logout };
});
```

```vue
<!-- Using the store in a component -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/useUserStore';

const userStore = useUserStore();

onMounted(() => userStore.fetchUsers());
</script>

<template>
  <div>
    <p v-if="userStore.isLoggedIn">Welcome, {{ userStore.currentUser?.name }}</p>
    <p v-if="userStore.loading">Loading users...</p>
    <ul>
      <li v-for="user in userStore.users" :key="user.id">{{ user.name }}</li>
    </ul>
    <button @click="userStore.logout">Logout</button>
  </div>
</template>
```

---

## 7. Vue Router

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/useUserStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/views/HomeView.vue') },
    { path: '/login', component: () => import('@/views/LoginView.vue') },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', component: () => import('@/views/dashboard/OverviewView.vue') },
        { path: 'settings', component: () => import('@/views/dashboard/SettingsView.vue') },
      ]
    },
    { path: '/user/:id', component: () => import('@/views/UserView.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') }
  ]
});

// Navigation guard
router.beforeEach((to) => {
  const userStore = useUserStore();
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return '/login';
  }
});

export default router;
```

```vue
<!-- Using route params in a component -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const userId = computed(() => Number(route.params.id));

function goBack() {
  router.back();
}

function goToUser(id: number) {
  router.push({ path: `/user/${id}` });
}
</script>
```

---

## 8. Provide / Inject

`provide` and `inject` allow deep component trees to share data without prop drilling:

```typescript
// In a parent component or plugin
import { provide, ref } from 'vue';

const theme = ref('light');
provide('theme', { theme, toggle: () => theme.value = theme.value === 'light' ? 'dark' : 'light' });
```

```vue
<!-- In any deeply nested child -->
<script setup lang="ts">
import { inject, Ref } from 'vue';

const { theme, toggle } = inject<{
  theme: Ref<string>;
  toggle: () => void;
}>('theme')!;
</script>

<template>
  <button @click="toggle">Current theme: {{ theme }}</button>
</template>
```

---

## 9. Forms with Validation

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue';

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
});

const errors = computed(() => {
  const errs: Record<string, string> = {};
  if (!form.email.includes('@')) errs.email = 'Enter a valid email';
  if (form.password.length < 8) errs.password = 'Min 8 characters';
  if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
  return errs;
});

const isValid = computed(() => Object.keys(errors.value).length === 0);

function handleSubmit() {
  if (!isValid.value) return;
  console.log('Submitting:', form);
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model.trim="form.email" type="email" placeholder="Email" />
      <span v-if="errors.email" class="error">{{ errors.email }}</span>
    </div>
    <div>
      <input v-model="form.password" type="password" placeholder="Password" />
      <span v-if="errors.password" class="error">{{ errors.password }}</span>
    </div>
    <div>
      <input v-model="form.confirmPassword" type="password" placeholder="Confirm Password" />
      <span v-if="errors.confirmPassword" class="error">{{ errors.confirmPassword }}</span>
    </div>
    <button type="submit" :disabled="!isValid">Register</button>
  </form>
</template>
```

---

## 10. Async Components and Suspense

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

const HeavyChart = defineAsyncComponent({
  loader: () => import('@/components/HeavyChart.vue'),
  loadingComponent: () => import('@/components/Spinner.vue'),
  errorComponent: () => import('@/components/ErrorMessage.vue'),
  delay: 200,
  timeout: 5000,
});
</script>

<template>
  <Suspense>
    <template #default>
      <HeavyChart :data="chartData" />
    </template>
    <template #fallback>
      <p>Loading chart...</p>
    </template>
  </Suspense>
</template>
```

---

## Conclusion

Vue 3's Composition API brings a level of flexibility and code organization that rivals any framework, while retaining the gentle learning curve Vue is known for. The combination of `<script setup>`, composables, Pinia, and Vue Router gives you a complete, cohesive toolkit. Whether you're migrating from Vue 2 or starting fresh, the Composition API is the path forward.

---

*Last updated: April 2026*