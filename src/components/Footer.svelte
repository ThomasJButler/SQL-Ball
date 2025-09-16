<script lang="ts">
  import { Github, Linkedin, Heart, ExternalLink } from 'lucide-svelte';
</script>

<footer class="footer-container bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 mt-auto">
  <div class="max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Left side - Brand and copyright -->
      <div class="flex flex-col items-center md:items-start gap-2">
        <div class="flex items-center gap-2">
          <img src="/football.svg" alt="SQL Ball" class="w-6 h-6" />
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">SQL-Ball</span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          © 2025 SQL-Ball. Built with <Heart class="inline w-3 h-3 text-red-500" /> for data enthusiasts
        </p>
      </div>

      <!-- Center - Description -->
      <div class="text-center px-4">
        <p class="text-xs text-slate-600 dark:text-slate-400">
          RAG-powered football analytics platform
        </p>
      </div>

      <!-- Right side - Social links -->
      <div class="flex items-center gap-4">
        <a
          href="https://github.com/ThomasJButler/SQL-Ball"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
          aria-label="GitHub Repository"
        >
          <Github class="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
          <span class="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">GitHub</span>
          <ExternalLink class="w-3 h-3 text-slate-400 dark:text-slate-500" />
        </a>

        <a
          href="https://www.linkedin.com/in/thomasjbutler/"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
          aria-label="LinkedIn Profile"
        >
          <Linkedin class="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <span class="text-xs text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">LinkedIn</span>
          <ExternalLink class="w-3 h-3 text-slate-400 dark:text-slate-500" />
        </a>
      </div>
    </div>
  </div>
</footer>

<style>
  .footer-container {
    backdrop-filter: blur(8px);
    background-color: rgba(255, 255, 255, 0.95);
  }

  :global(.dark) .footer-container {
    background-color: rgba(15, 23, 42, 0.95);
  }
</style>