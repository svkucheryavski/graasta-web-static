<script>
	import { onMount, setContext } from 'svelte';

   export let position = "top";

   if (["top", "bottom"].indexOf(position) < 0) {
      throw Error("Wrong value for parameter 'position'.")
   }

   let items = [];
   let currentSelection = -1;

   const addItem = function(item) {
      items = [...items, item];
   }

   function selectTab(newSelection) {
      if (newSelection < 0 || newSelection === currentSelection) return;
      if (currentSelection >= 0) items[currentSelection].domElement.style.display = "none";
      items[newSelection].domElement.style.display = "block";
      currentSelection = newSelection;
   }

   function handleTabClick(event) {
      const el = event.target;
      if (!el || el.tagName !== "LI") return;
      selectTab(Array.prototype.indexOf.call(el.parentNode.children, el));
   }

	setContext('tabs', {addItem: addItem});

   onMount( () => {
      selectTab(0);
   })
</script>


<div class="tabs-container tabs-container_{position}" >
   <nav class="tabs-menu">
      <ul on:click={handleTabClick}>
         {#each items as item, i}
         <li class:selected={i == currentSelection}>{item.title}</li>
         {/each}
      </ul>
   </nav>
   <div class="tab-panels">
      <slot></slot>
   </div>
</div>

<style>
   .tabs-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
   }

   .tabs-menu {
      flex-basis: min-content;
      flex-grow: 0;
      flex-shrink: 0;
   }

   .tab-panels {
      flex-basis: 100%;
      flex-grow: 1;
      flex-shrink: 1;
      background: yellowgreen;
   }

   .tabs-menu ul {
      list-style: none;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
   }

   .tabs-menu ul > li {
      list-style: none;
      margin: 0 0.1em;
      padding: 0.5em 1em;
      display: inline-block;
      box-sizing: border-box;
      user-select: none;
      cursor: default;

      border-color: inherit;
   }

   .tabs-menu ul > li.selected {
      font-weight: 600;
   }

   /* position top */

   .tabs-container_top .tabs-menu ul {
      border-bottom: solid 1px #606060;
   }

   .tabs-container_top .tabs-menu ul > li {
      padding-top: 0.5em;
      padding-bottom: 0.1em;
   }

   .tabs-container_top .tabs-menu ul > li.selected {
      border-bottom-width: 3px #606060;
   }

   /* position bottom */
   .tabs-container_bottom {
      flex-direction: column-reverse;
   }

   .tabs-container_bottom .tabs-menu ul {
      border-top-style: solid;
      border-top-width: 1px;
   }

   .tabs-container_bottom .tabs-menu ul > li {
      padding-bottom: 0.5em;
      padding-top: 0.1em;
   }

   .tabs-container_bottom .tabs-menu ul > li:hover {
      border-top-style: solid;
      border-top-width: 1px;
   }

   .tabs-container_bottom .tabs-menu ul > li.selected {
      border-top-style: solid;
      border-top-width: 3px;
   }
</style>