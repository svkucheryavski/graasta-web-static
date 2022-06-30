<script>
   import { createEventDispatcher } from "svelte";
   import { fade, fly } from "svelte/transition";

   import AppFrame from "./AppFrame.svelte";
   const dispatch = createEventDispatcher();

   export let id;
   export let title;
   export let video;
   export let help;
   export let info;
   export let tab = "app";

   // possible tabs
   const tabs = ["app", "video", "info"];

   function handleKeydown(event) {
      if (event.key == "Escape") dispatch("close");
   }
</script>

<svelte:window on:keydown={handleKeydown}/>

<div transition:fade class="backstage">
   <article transition:fly="{{ x: -500, duration: 600 }}"  class="modal">
      <header class="modal-header">
         <h2 title="click to close"><a href="/">{@html title}</a></h2>
      </header>
      <section class="modal-content">
         <div class="content-container" class:hidden={tab != "app"}>
            <AppFrame {id} />
         </div>
         {#if video}
         <div class="content-container" class:hidden={tab != "video"} >
            <iframe width="100%" height="100%" src="{video}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
         </div>
         {/if}
         <div class="content-container helptext" class:hidden={tab != "info"}>
            {@html help}
         </div>
      </section>
      <footer class="modal-footer">
         <nav class="tablist" role="tablist">
            <a role="tab" class:selected={tab==="app"} href="#{id}/app">App</a>
            {#if video}
            <a role="tab" class:selected={tab==="video"} href="#{id}/video">Video</a>
            {/if}
            {#if help}
            <a role="tab" class:selected={tab==="info"} href="#{id}/info">Info</a>
            {/if}
         </nav>
      </footer>
   </article>
</div>

<style>
   .tablist {
      padding: 0;
      margin: 0;
   }

   .tablist a, .tablist a:focus, .tablist a:active {
      text-decoration: none;
      background: transparent;
      color: #a0a0a0;
      height: 100%;
      cursor: pointer;
      display: inline-block;
      font-size: 0.7em;
      padding: 0 0.25em;
      margin: 0 0.25em;
   }

   .modal-footer a:hover {
      color: #ff9900;
   }

   .modal-footer a.selected {
      color: #e0e0e0;
      font-weight: bold;
      border-top: solid 5px #fefefe;
   }

   .hidden {
      display: none;
   }

   .backstage {
      position: fixed;
      top:0;
      left:0;
      right: 0;
      bottom: 0;
      /* background: rgba(0.2, 0, 0, 0.85); */
      background: #303030;
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
      padding: 0;
   }


   .modal-header > h2 {
      text-align: center;
      user-select: none;
      font-size: 1.25em;
      font-weight: 500;
      padding: 0.5em;
      cursor: default;
      color: #e0e0e0;
   }

   .modal-header > h2 > a{
      text-decoration: none;
      user-select: none;
      color: #e0e0e0;
   }

   .modal-header > h2 > a::after {
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

   .modal-header > h2:hover a::after{
      background: #ff9900;
      color: #301000;
   }

   .modal-content  {
      margin: 0 auto;
      padding: 5px;
      background: #fefefe;
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
      background: #fefefe;
   }

   /* help text  */

   .helptext {
      padding: 1em;
      line-height: 1.35em;
      font-size: 1em;
      color: #303030;
   }

   .helptext :global(h2) {
      padding: 1.25em 0 1em 0;
      font-size: 1.2em;
   }

   .helptext :global(p) {
      padding: 0 0 0.5em 0;
      line-height: 1.5em;
      font-size: 1em;
   }
</style>

