<script>
   import { createEventDispatcher } from "svelte";
   import { fade, scale, fly } from "svelte/transition";

   import AppFrame from "./AppFrame.svelte";
   const dispatch = createEventDispatcher();

   export let id;
   let title = id;
</script>

<div transition:fade class="backstage" on:click={() => dispatch("close")}>
   <article transition:fly="{{ x: -500, duration: 600 }}"  class="modal" on:click={null}>
      <header class="modal-header">
         <h2>{@html title}</h2>
      </header>
      <section class="modal-content">
         <div class="content-container">
            <AppFrame {id} />
         </div>
      </section>
      <footer class="modal-footer">

      </footer>
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
      height: min(700px, 100%);
      overflow: auto;

      display: flex;
      flex-direction: column;
   }

   .modal-footer,
   .modal-header {
      background: #303030;
   }

   .modal-footer {
      text-align: center;
      height: 1.75em;
      font-size: 1.25em;
      font-weight: 500;
      padding: 0.25em;
   }


   .modal-header > h2 {
      text-align: center;
      font-size: 1.25em;
      font-weight: 500;
      padding: 0.25em;
      color: #e0e0e0;
   }

   .modal-header > h2::after {
      content: '×';
      display: inline-block;
      margin-left: 10px;
      width: 20px;
      height: 20px;
      line-height: 20px;
      border-radius: 50%;
      background: #606060;
      color: #e0e0e0;
   }

   .modal-header > h2:hover::after{
      background: #ff9900;
      color: #301000;
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

   .modal-content > .content-container {

      min-width: 800px;
      min-height: 450px;

      width: auto;
      height: 100%;

      aspect-ratio: 16/9;
      margin: 0 auto;
      padding: 0;
      background: #fafafa;
   }
</style>

