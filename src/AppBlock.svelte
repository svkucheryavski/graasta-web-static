<script>
   import AppDetails from "./AppDetails.svelte";

   export let title;
   export let apps;
</script>

<article class="app-block">
   <h2>{title}</h2>
   <ul>
      {#each apps as app}
      <li><AppDetails {...app} on:showdemo /></li>
      {:else}
      <p>No apps available in this block.</p>
      {/each}
   </ul>
</article>

<style>
   .app-block {
      margin: 0;
      padding: 2.0em 0 0 0 ;
   }

   h2 {
      font-size: 1.2em;
      margin: 0;
      padding: 0;
   }

   p {
      font-size: 0.85em;
      color: #909090;
   }

   ul, li {
      margin: 0;
      padding: 0;
      text-indent: 0;
      list-style: none;
   }


   ul {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
   }

   li {
      flex-grow: 1;
      flex-shrink: 0;
      flex-basis: 450px;
      min-width: 450px;
      box-sizing: border-box;
      padding-top: 0.75em;
   }
</style>