<script>
   import { createEventDispatcher } from "svelte";
   import { fade, scale, fly } from "svelte/transition";

   import AppFrame from "./AppFrame.svelte";
   const dispatch = createEventDispatcher();

   export let id;
   let title = id;
</script>

<div in:fade out:fade class="backstage" on:click={() => dispatch("close")}>
   <article in:fly out:fly class="modal" on:click={null}>
      <header class="modal-header">
         <h2>{@html title}</h2>
      </header>
      <section class="modal-content">
         <div class="app-container">
            <AppFrame {id} />
         </div>
      </section>
   </article>
</div>

<style>

   .backstage {
      position: fixed;
      top:0;
      left:0;
      right: 0;
      bottom: 0;
      background: rgba(0.2, 0, 0, 0.75);

      display: flex;
      justify-content: center;
      align-items: center;
   }

   .modal {
      margin: 0 auto;
      padding-bottom: 0.25em;
      flex-basis: max-content;
      flex-shrink: 0;
      flex-grow: 1;
      width: 100%;

      position: relative;
      height: max-content;
      overflow: auto;

      display: flex;
      flex-direction: column;
   }

   .modal-header {
      background: rgba(0.2, 0, 0, 0.5);
   }


   .modal-header > h2 {
      text-align: center;
      font-size: 1.5em;
      font-weight: 500;
      padding: 0.5em;
      color: #808080;
      border-bottom: 1px solid #e0e0e0;
   }

   .modal-content  {
      margin: 0 auto;
      padding: 10px;
      background: white;
      height: max-content;
      overflow: auto;
      width: 100%;
      height: 100%;
   }

   .modal-content > .app-container {
      max-width: 1200px;
      min-width: 800px;
      width: 100%;
      height: auto;
      aspect-ratio: 16/9;
      margin: 0 auto;
      padding: 0;
      background: #fafafa;
   }
</style>

