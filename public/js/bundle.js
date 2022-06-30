
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/AppDetails.svelte generated by Svelte v3.48.0 */

    const file$4 = "src/AppDetails.svelte";

    // (15:9) {#if video}
    function create_if_block$2(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Watch");
    			attr_dev(a, "class", "toolbar__link toolbar__link_watch svelte-1wsuemj");
    			attr_dev(a, "title", "Video");
    			attr_dev(a, "href", a_href_value = "#" + /*id*/ ctx[0] + "/video");
    			add_location(a, file$4, 15, 9, 395);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*id*/ 1 && a_href_value !== (a_href_value = "#" + /*id*/ ctx[0] + "/video")) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(15:9) {#if video}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let span;
    	let t0;
    	let t1;
    	let div1;
    	let h3;
    	let t2;
    	let t3;
    	let p;
    	let t4;
    	let t5;
    	let div0;
    	let a0;
    	let t6;
    	let a0_href_value;
    	let t7;
    	let t8;
    	let a1;
    	let t9;
    	let a1_href_value;
    	let if_block = /*video*/ ctx[3] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			span = element("span");
    			t0 = text(/*id*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			t2 = text(/*title*/ ctx[1]);
    			t3 = space();
    			p = element("p");
    			t4 = text(/*info*/ ctx[2]);
    			t5 = space();
    			div0 = element("div");
    			a0 = element("a");
    			t6 = text("Try");
    			t7 = space();
    			if (if_block) if_block.c();
    			t8 = space();
    			a1 = element("a");
    			t9 = text("Download");
    			attr_dev(span, "class", "app-id svelte-1wsuemj");
    			add_location(span, file$4, 8, 3, 141);
    			attr_dev(h3, "class", "svelte-1wsuemj");
    			add_location(h3, file$4, 10, 6, 206);
    			attr_dev(p, "class", "svelte-1wsuemj");
    			add_location(p, file$4, 11, 6, 229);
    			attr_dev(a0, "class", "toolbar__link toolbar__link_try svelte-1wsuemj");
    			attr_dev(a0, "title", "Run demo");
    			attr_dev(a0, "href", a0_href_value = "#" + /*id*/ ctx[0] + "/app");
    			add_location(a0, file$4, 13, 9, 280);
    			attr_dev(a1, "class", "toolbar__link toolbar__link_download svelte-1wsuemj");
    			attr_dev(a1, "title", "Download");
    			attr_dev(a1, "href", a1_href_value = "/apps/" + /*id*/ ctx[0] + ".zip");
    			add_location(a1, file$4, 17, 9, 507);
    			attr_dev(div0, "class", "toolbar svelte-1wsuemj");
    			add_location(div0, file$4, 12, 6, 249);
    			attr_dev(div1, "class", "app-info svelte-1wsuemj");
    			add_location(div1, file$4, 9, 3, 177);
    			attr_dev(div2, "class", "app-details svelte-1wsuemj");
    			add_location(div2, file$4, 7, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, span);
    			append_dev(span, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t2);
    			append_dev(div1, t3);
    			append_dev(div1, p);
    			append_dev(p, t4);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, t6);
    			append_dev(div0, t7);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div0, t8);
    			append_dev(div0, a1);
    			append_dev(a1, t9);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) set_data_dev(t0, /*id*/ ctx[0]);
    			if (dirty & /*title*/ 2) set_data_dev(t2, /*title*/ ctx[1]);
    			if (dirty & /*info*/ 4) set_data_dev(t4, /*info*/ ctx[2]);

    			if (dirty & /*id*/ 1 && a0_href_value !== (a0_href_value = "#" + /*id*/ ctx[0] + "/app")) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (/*video*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div0, t8);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*id*/ 1 && a1_href_value !== (a1_href_value = "/apps/" + /*id*/ ctx[0] + ".zip")) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppDetails', slots, []);
    	let { id } = $$props;
    	let { title } = $$props;
    	let { info } = $$props;
    	let { video = undefined } = $$props;
    	const writable_props = ['id', 'title', 'info', 'video'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('info' in $$props) $$invalidate(2, info = $$props.info);
    		if ('video' in $$props) $$invalidate(3, video = $$props.video);
    	};

    	$$self.$capture_state = () => ({ id, title, info, video });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('info' in $$props) $$invalidate(2, info = $$props.info);
    		if ('video' in $$props) $$invalidate(3, video = $$props.video);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, title, info, video];
    }

    class AppDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { id: 0, title: 1, info: 2, video: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppDetails",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !('id' in props)) {
    			console.warn("<AppDetails> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<AppDetails> was created without expected prop 'title'");
    		}

    		if (/*info*/ ctx[2] === undefined && !('info' in props)) {
    			console.warn("<AppDetails> was created without expected prop 'info'");
    		}
    	}

    	get id() {
    		throw new Error("<AppDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<AppDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AppDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get info() {
    		throw new Error("<AppDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set info(value) {
    		throw new Error("<AppDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get video() {
    		throw new Error("<AppDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set video(value) {
    		throw new Error("<AppDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AppBlock.svelte generated by Svelte v3.48.0 */
    const file$3 = "src/AppBlock.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (13:6) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No apps available in this block.";
    			attr_dev(p, "class", "svelte-i7rmfd");
    			add_location(p, file$3, 13, 6, 252);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(13:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (11:6) {#each apps as app}
    function create_each_block$1(ctx) {
    	let li;
    	let appdetails;
    	let current;
    	const appdetails_spread_levels = [/*app*/ ctx[2]];
    	let appdetails_props = {};

    	for (let i = 0; i < appdetails_spread_levels.length; i += 1) {
    		appdetails_props = assign(appdetails_props, appdetails_spread_levels[i]);
    	}

    	appdetails = new AppDetails({ props: appdetails_props, $$inline: true });

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(appdetails.$$.fragment);
    			attr_dev(li, "class", "svelte-i7rmfd");
    			add_location(li, file$3, 11, 6, 199);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(appdetails, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appdetails_changes = (dirty & /*apps*/ 2)
    			? get_spread_update(appdetails_spread_levels, [get_spread_object(/*app*/ ctx[2])])
    			: {};

    			appdetails.$set(appdetails_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appdetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appdetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(appdetails);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(11:6) {#each apps as app}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let article;
    	let h2;
    	let t0;
    	let t1;
    	let ul;
    	let current;
    	let each_value = /*apps*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	const block = {
    		c: function create() {
    			article = element("article");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(h2, "class", "svelte-i7rmfd");
    			add_location(h2, file$3, 8, 3, 142);
    			attr_dev(ul, "class", "svelte-i7rmfd");
    			add_location(ul, file$3, 9, 3, 162);
    			attr_dev(article, "class", "app-block svelte-i7rmfd");
    			add_location(article, file$3, 7, 0, 111);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h2);
    			append_dev(h2, t0);
    			append_dev(article, t1);
    			append_dev(article, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (dirty & /*apps*/ 2) {
    				each_value = /*apps*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(ul, null);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppBlock', slots, []);
    	let { title } = $$props;
    	let { apps } = $$props;
    	const writable_props = ['title', 'apps'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppBlock> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('apps' in $$props) $$invalidate(1, apps = $$props.apps);
    	};

    	$$self.$capture_state = () => ({ AppDetails, title, apps });

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('apps' in $$props) $$invalidate(1, apps = $$props.apps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, apps];
    }

    class AppBlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { title: 0, apps: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppBlock",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !('title' in props)) {
    			console.warn("<AppBlock> was created without expected prop 'title'");
    		}

    		if (/*apps*/ ctx[1] === undefined && !('apps' in props)) {
    			console.warn("<AppBlock> was created without expected prop 'apps'");
    		}
    	}

    	get title() {
    		throw new Error("<AppBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AppBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get apps() {
    		throw new Error("<AppBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apps(value) {
    		throw new Error("<AppBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/AppFrame.svelte generated by Svelte v3.48.0 */

    const file$2 = "src/AppFrame.svelte";

    function create_fragment$2(ctx) {
    	let iframe;
    	let t;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			t = text("Loading");
    			attr_dev(iframe, "title", /*id*/ ctx[0]);
    			if (!src_url_equal(iframe.src, iframe_src_value = "/apps/" + /*id*/ ctx[0] + "/index.html")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			attr_dev(iframe, "class", "svelte-1tc7xux");
    			add_location(iframe, file$2, 4, 0, 38);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    			append_dev(iframe, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) {
    				attr_dev(iframe, "title", /*id*/ ctx[0]);
    			}

    			if (dirty & /*id*/ 1 && !src_url_equal(iframe.src, iframe_src_value = "/apps/" + /*id*/ ctx[0] + "/index.html")) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppFrame', slots, []);
    	let { id } = $$props;
    	const writable_props = ['id'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppFrame> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({ id });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id];
    }

    class AppFrame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { id: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppFrame",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !('id' in props)) {
    			console.warn("<AppFrame> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<AppFrame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppFrame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AppDemo.svelte generated by Svelte v3.48.0 */
    const file$1 = "src/AppDemo.svelte";

    // (34:9) {#if video}
    function create_if_block_2(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			if (!src_url_equal(iframe.src, iframe_src_value = /*video*/ ctx[2])) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "YouTube video player");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$1, 35, 12, 1063);
    			attr_dev(div, "class", "content-container svelte-1x2g6sw");
    			toggle_class(div, "hidden", /*tab*/ ctx[4] != "video");
    			add_location(div, file$1, 34, 9, 988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*video*/ 4 && !src_url_equal(iframe.src, iframe_src_value = /*video*/ ctx[2])) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}

    			if (dirty & /*tab*/ 16) {
    				toggle_class(div, "hidden", /*tab*/ ctx[4] != "video");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(34:9) {#if video}",
    		ctx
    	});

    	return block;
    }

    // (46:12) {#if video}
    function create_if_block_1(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Video");
    			attr_dev(a, "role", "tab");
    			attr_dev(a, "href", a_href_value = "#" + /*id*/ ctx[0] + "/video");
    			attr_dev(a, "class", "svelte-1x2g6sw");
    			toggle_class(a, "selected", /*tab*/ ctx[4] === "video");
    			add_location(a, file$1, 46, 12, 1646);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*id*/ 1 && a_href_value !== (a_href_value = "#" + /*id*/ ctx[0] + "/video")) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*tab*/ 16) {
    				toggle_class(a, "selected", /*tab*/ ctx[4] === "video");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(46:12) {#if video}",
    		ctx
    	});

    	return block;
    }

    // (49:12) {#if help}
    function create_if_block$1(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Info");
    			attr_dev(a, "role", "tab");
    			attr_dev(a, "href", a_href_value = "#" + /*id*/ ctx[0] + "/info");
    			attr_dev(a, "class", "svelte-1x2g6sw");
    			toggle_class(a, "selected", /*tab*/ ctx[4] === "info");
    			add_location(a, file$1, 49, 12, 1773);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*id*/ 1 && a_href_value !== (a_href_value = "#" + /*id*/ ctx[0] + "/info")) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*tab*/ 16) {
    				toggle_class(a, "selected", /*tab*/ ctx[4] === "info");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(49:12) {#if help}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let article;
    	let header;
    	let h2;
    	let t0;
    	let section;
    	let div0;
    	let appframe;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let footer;
    	let nav;
    	let a;
    	let t4;
    	let a_href_value;
    	let t5;
    	let t6;
    	let article_transition;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	appframe = new AppFrame({
    			props: { id: /*id*/ ctx[0] },
    			$$inline: true
    		});

    	let if_block0 = /*video*/ ctx[2] && create_if_block_2(ctx);
    	let if_block1 = /*video*/ ctx[2] && create_if_block_1(ctx);
    	let if_block2 = /*help*/ ctx[3] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			article = element("article");
    			header = element("header");
    			h2 = element("h2");
    			t0 = space();
    			section = element("section");
    			div0 = element("div");
    			create_component(appframe.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			footer = element("footer");
    			nav = element("nav");
    			a = element("a");
    			t4 = text("App");
    			t5 = space();
    			if (if_block1) if_block1.c();
    			t6 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(h2, "title", "click to close");
    			attr_dev(h2, "class", "svelte-1x2g6sw");
    			add_location(h2, file$1, 27, 9, 708);
    			attr_dev(header, "class", "modal-header svelte-1x2g6sw");
    			add_location(header, file$1, 26, 6, 669);
    			attr_dev(div0, "class", "content-container svelte-1x2g6sw");
    			toggle_class(div0, "hidden", /*tab*/ ctx[4] != "app");
    			add_location(div0, file$1, 30, 9, 852);
    			attr_dev(div1, "class", "content-container helptext svelte-1x2g6sw");
    			toggle_class(div1, "hidden", /*tab*/ ctx[4] != "info");
    			add_location(div1, file$1, 38, 9, 1320);
    			attr_dev(section, "class", "modal-content svelte-1x2g6sw");
    			add_location(section, file$1, 29, 6, 811);
    			attr_dev(a, "role", "tab");
    			attr_dev(a, "href", a_href_value = "#" + /*id*/ ctx[0] + "/app");
    			attr_dev(a, "class", "svelte-1x2g6sw");
    			toggle_class(a, "selected", /*tab*/ ctx[4] === "app");
    			add_location(a, file$1, 44, 12, 1542);
    			attr_dev(nav, "class", "tablist svelte-1x2g6sw");
    			attr_dev(nav, "role", "tablist");
    			add_location(nav, file$1, 43, 9, 1493);
    			attr_dev(footer, "class", "modal-footer svelte-1x2g6sw");
    			add_location(footer, file$1, 42, 6, 1454);
    			attr_dev(article, "class", "modal svelte-1x2g6sw");
    			add_location(article, file$1, 25, 3, 592);
    			attr_dev(div2, "class", "backstage svelte-1x2g6sw");
    			add_location(div2, file$1, 24, 0, 549);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, article);
    			append_dev(article, header);
    			append_dev(header, h2);
    			h2.innerHTML = /*title*/ ctx[1];
    			append_dev(article, t0);
    			append_dev(article, section);
    			append_dev(section, div0);
    			mount_component(appframe, div0, null);
    			append_dev(section, t1);
    			if (if_block0) if_block0.m(section, null);
    			append_dev(section, t2);
    			append_dev(section, div1);
    			div1.innerHTML = /*help*/ ctx[3];
    			append_dev(article, t3);
    			append_dev(article, footer);
    			append_dev(footer, nav);
    			append_dev(nav, a);
    			append_dev(a, t4);
    			append_dev(nav, t5);
    			if (if_block1) if_block1.m(nav, null);
    			append_dev(nav, t6);
    			if (if_block2) if_block2.m(nav, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*handleKeydown*/ ctx[6], false, false, false),
    					listen_dev(h2, "click", /*click_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 2) h2.innerHTML = /*title*/ ctx[1];			const appframe_changes = {};
    			if (dirty & /*id*/ 1) appframe_changes.id = /*id*/ ctx[0];
    			appframe.$set(appframe_changes);

    			if (dirty & /*tab*/ 16) {
    				toggle_class(div0, "hidden", /*tab*/ ctx[4] != "app");
    			}

    			if (/*video*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(section, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty & /*help*/ 8) div1.innerHTML = /*help*/ ctx[3];
    			if (dirty & /*tab*/ 16) {
    				toggle_class(div1, "hidden", /*tab*/ ctx[4] != "info");
    			}

    			if (!current || dirty & /*id*/ 1 && a_href_value !== (a_href_value = "#" + /*id*/ ctx[0] + "/app")) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*tab*/ 16) {
    				toggle_class(a, "selected", /*tab*/ ctx[4] === "app");
    			}

    			if (/*video*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(nav, t6);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*help*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(nav, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appframe.$$.fragment, local);

    			add_render_callback(() => {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, fly, { x: -500, duration: 600 }, true);
    				article_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appframe.$$.fragment, local);
    			if (!article_transition) article_transition = create_bidirectional_transition(article, fly, { x: -500, duration: 600 }, false);
    			article_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(appframe);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (detaching && article_transition) article_transition.end();
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AppDemo', slots, []);
    	const dispatch = createEventDispatcher();
    	let { id } = $$props;
    	let { title } = $$props;
    	let { video } = $$props;
    	let { help } = $$props;
    	let { tab = "app" } = $$props;

    	// possible tabs
    	const tabs = ["app", "video", "info"];

    	function handleKeydown(event) {
    		if (event.key == "Escape") dispatch("close");
    	}

    	const writable_props = ['id', 'title', 'video', 'help', 'tab'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AppDemo> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("close");

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('video' in $$props) $$invalidate(2, video = $$props.video);
    		if ('help' in $$props) $$invalidate(3, help = $$props.help);
    		if ('tab' in $$props) $$invalidate(4, tab = $$props.tab);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fade,
    		fly,
    		AppFrame,
    		dispatch,
    		id,
    		title,
    		video,
    		help,
    		tab,
    		tabs,
    		handleKeydown
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('video' in $$props) $$invalidate(2, video = $$props.video);
    		if ('help' in $$props) $$invalidate(3, help = $$props.help);
    		if ('tab' in $$props) $$invalidate(4, tab = $$props.tab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id, title, video, help, tab, dispatch, handleKeydown, click_handler];
    }

    class AppDemo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			id: 0,
    			title: 1,
    			video: 2,
    			help: 3,
    			tab: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AppDemo",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !('id' in props)) {
    			console.warn("<AppDemo> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<AppDemo> was created without expected prop 'title'");
    		}

    		if (/*video*/ ctx[2] === undefined && !('video' in props)) {
    			console.warn("<AppDemo> was created without expected prop 'video'");
    		}

    		if (/*help*/ ctx[3] === undefined && !('help' in props)) {
    			console.warn("<AppDemo> was created without expected prop 'help'");
    		}
    	}

    	get id() {
    		throw new Error("<AppDemo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<AppDemo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<AppDemo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AppDemo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get video() {
    		throw new Error("<AppDemo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set video(value) {
    		throw new Error("<AppDemo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get help() {
    		throw new Error("<AppDemo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set help(value) {
    		throw new Error("<AppDemo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tab() {
    		throw new Error("<AppDemo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tab(value) {
    		throw new Error("<AppDemo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const appBlocks = [{"title": "Descriptive statistics and plots", "apps": [{"id": "asta-b101", "title": "Quantiles, quartiles, percentiles", "info": "How to compute simple statistics for a sample.", "video": "https://www.youtube.com/embed/l_tnFhwRpjI", "help": "<h2>Quantiles, quartiles, percentiles</h2><p>This app shows calculation of main non-parametric descriptive statistics: <i>min</i>, <i>max</i>, <i>quartiles</i> and <i>percentils</i>. The plot contains current sample values as points and the traditional box and whiskers plot. The dashed line inside the box shows the mean. The red elements represent boundaries for detection of outliers (based on \u00b11.5IQR rule).</p><p>Try to change the smallest (<i>min</i>) or the largest (<i>max</i>) values of your current sample using the sliders in order to see what happens to the boxplot if one of the values will be outside the boundaries. You can also pay attention which statistics are changing and which remain stable in this case.</p><p>The table in the bottom shows the current values (<i>x</i>) ordered from smallest to largest, their rank (<i>i</i>), as well as their percentiles (<i>p</i>) also known as <em>sample quantiles</em>. The percentiles are computed using <code>(i - 0.5)/n</code> rule. The table on the right side shows the computed statistics.</p>"}, {"id": "asta-b102", "title": "Samples and populations", "info": "How a sample taken from a population looks like.", "video": "https://www.youtube.com/embed/hhGmFVMm5ZE", "help": "<h2>Samples and populations</h2> <p>This app helps you to investigate how different a sample can be when it is being randomly taken from corresponding population.</p> <p>You can investigate this difference for one of the three parameters: Height, Age and IQ of a population of people. Each parameter has own distribution. Thus, <em>Age</em> is distributed uniformly, <em>IQ</em> is distributed normally and <em>Height</em> has distribution with two peaks (bimodal). You can also see how sample size influences the difference.</p>  <p>Plot series made for a population (histogram and boxplot on the left part and percentile plot on the right) are shown using gray colors. The size of the population is <em>N</em> = 50&nbsp;000. The plot series for current sample are shown in blue. A new sample is taken when you change any of the controls \u2014 select the population parameter or the sample size as well as when you force to take a new sample by clicking the specific button.</p>"}, {"id": "asta-b103", "title": "PDF, CDF and ICDF", "info": "Main functions for theoretical distributions.", "video": "https://www.youtube.com/embed/lS2iK4Rymy4 ", "help": "<h2>PDF, CDF, and ICDF</h2>  <p>This app lets you play with three main functions available for any theoretical distribution: <em>Probability Density Function</em> (PDF), <em>Cumulative Distribution Function</em> (CDF) and <em>Inverse Cumulative Distribution Function</em> (ICDF). The functions can be used for different purposes. Thus PDF shows a shape of distribution in form of a density of the values, the higher density \u2014 the bigger chance that your random value will be there. For example, in case of normal distribution, the highest density is around <em>mean</em>, so mean is the most expected value in this case.</p> <p>CDF function gives you a chance to get a value smaller than given. While the ICDF does the opposite \u2014 gives you a value for a given probability. The functions in this app can be used in \"Value\" mode, for a single value, as well as in \"Interval\" mode for an interval limited by two values.</p> <p>For example, we are talking about height of people, normally distributed with mean = 170 cm and std = 10 cm (initial settings of the app). What is a chance that a random person from this population will have height between 160 and 180 cm? Or, in other words, how many people in percent have height between these two values in the population? Just set <em>x</em><sub>1</sub> to 160 and <em>x</em><sub>2</sub> to 180 under the CDF plot and you will see the result (in this case the chance is around 0.683 or 68.3%).</p>"}, {"id": "asta-b104", "title": "Quantile-quantile plot", "info": "How to create and interpret a QQ-plot.", "video": "https://www.youtube.com/embed/G12DrRZAPHA", "help": "<h2>Quantile-quantile plot</h2><p>This app shows how to use quantile-quantile (QQ) plot to check if your values came from normally distributed population. In this case the values (height of people, <em>x</em>) are indeed randomly taken from a population, where they follow normal distribution with mean = 170 cm and standard deviation = 10 cm. The values of the current sample are shown in the large table as row <em>x</em> and on the plot as y-axis values.</p> <p>First, for every value <em>x</em> we compute probability <em>p</em>, to get a value even smaller, similar to what we did when computed percentiles. In this case we use <code>p = (i - 0.5) / n</code>. But if sample size is smaller than 10, the formula is slightly different: <code>p = (i - 0.375) / (n + 0.25)</code>. For example, if sample size = 6, then the first value (i = 1) will have the following p: <code>p = (1 - 0.375) / (6 + 0.25) = 0.100</code>.</p> <p>After that, for every <em>p</em> we find corresponding standard score, <em>z</em>, using ICDF function for normal distribution. For example, if p = 0.100, the z-score can be found to be equal to -1.28. You can check it using app for PDF/CDF/ICDF or in R by running <code>qnorm(0.100)</code>. Finally we make a plot where sample values, <em>x</em> are shown as y-axis and the <em>z</em>-scores are shown as x-axis. In case if values follow normal distribution ideally they have linear dependence on z-scores, so the points will lie close to a straight line, shown as blue. The closer real points are to this line the more likely that they came from normally distributed population.</p>"}]}, {"title": "Confidence intervals", "apps": [{"id": "asta-b201", "title": "Population based CI for proportion", "info": "Confidence interval for proportion, based on population parameter.", "video": "", "help": "<h2>Population based confidence interval for proportion</h2> <p>This app allows you to play with proportion of a random sample. Here we have a population with N = 1600 individuals. Some of them are red, some are blue. You can change the proportion of the red individuals as you want (by default it is 50%). The population is shown as large plot on the left.</p> <p>If we know proportion of population and sample size we can compute an interval of expected proportions of the future samples. So, when you take a new random sample of that size from the population, its proportion will likely to be inside the interval. This interval is called <em>confidence interval for proportion</em> and since we compute it based on proportion parameter, it is <em>population based</em>.</p> <p>The interval for selected population proportion and current sample size computed for 95% confidence level is shown as a red area under a distribution curve on the right. The vertical line on that plot is a proportion of your current sample. Try to take many samples and see how often the proportion of the sample will be inside the interval (text on the plot shows this information). If you repeat this many (hundreds) times, about 95% of the samples should have proportion within the interval. <strong>However this works only if number of individuals in each group is at least 5.</strong> So if proportion is 10% you need to have sample size n = 50 to meat this requirement.</p>"}, {"id": "asta-b202", "title": "Sample based CI for proportion", "info": "Confidence interval for proportion, based on sample statistic.", "video": "https://www.youtube.com/embed/3lQRSkjL5ac", "help": "<h2>Sample based confidence interval for proportion</h2> <p>This app is similar to <code>asta-b201</code>, but, in this case, confidence interval is computed based on sample proportion. This requires larger sample size, so for every category you need at least 10 individuals in your sample. For example, if proportion is 20%, you need sample size of at least n = 50 to make a reliable interval (20% of 50 is 10). For p = 10% the sample size should be n = 100.</p> <p>The app shows 95% confidence interval computed for current sample as a plot on the right side. So, every time you take a new sample, this also results in a new confidence interval. The vertical red line on this plot shows the population proportion, which in real life we do not know. If you take a new sample many times (say, 200-300) you can see how often the population proportion, \u03c0, was inside the interval. If sample size is large enough it should be close to 95% \u2014\u00a0the confidence level.</p>"}, {"id": "asta-b203", "title": "Population based CI for mean", "info": "Confidence interval for mean, based on population parameter.", "video": "https://www.youtube.com/embed/cX8ErwtKMc8", "help": "<h2>Population based confidence interval for mean</h2> <p>This app is similar to <code>asta-b201</code> but is made to give you an idea about uncertainty of sample mean. Here we have a normally distributed population \u2014\u00a0concentration of Chloride in different parts of a water source. The concentration has a fixed mean, <em>\u00b5</em> = 100 mg/L, and a standard deviation, <em>\u03c3</em>, which you can vary from 1 to 5 mg/L. The population distribution is shown using gray colors on the left plot. Blue points on that plot show values of a current sample, randomly taken from the population. The vertical lines show the corresponding means.</p> <p>If we know mean of population, <em>\u00b5</em>, and sample size, we can compute an interval of expected mean values of the future samples, <em>m</em>. So, when you take a new random sample of that size from the population, its mean value will likely to be inside the interval. This interval is called <em>confidence interval for mean</em>and since we compute it based on population parameter, it is <em>population based</em>.</p> <p>Right plot shows distribution of possible mean values of samples to be randomly taken from the current population (and for current sample size). Confidence interval, computed for 95% confidence level is shown as a gray area under the distribution curve. The blue vertical line on that plot is a mean of your current sample. Try to take many samples and see how often the mean of a sample will be inside the interval (table under the plot shows this information). If you repeat this many (hundreds) times, about 95% of the samples should have mean within the interval.</p>"}, {"id": "asta-b204", "title": "Sample based CI for mean", "info": "Confidence interval for mean, based on sample statistics.", "video": "https://www.youtube.com/embed/EgE6-NNyyPc", "help": "<h2>Sample based confidence interval for mean</h2> <p>This app is similar to <code>asta-b203</code>, but in this case confidence interval for mean is computed using sample statistics, so we pretend we do not know the population mean and want to estimate it as a value located inside this interval. Thus on the right plot you see distribution and 95% confidence interval computed for current sample. The population mean (which in real life is unknown) is shown as a vertical line.</p> <p>        Try to take many samples and see how often mean of the population will be inside confidence interval computed for the sample. If you repeat this many (hundreds) times, about 95% of the samples will have interval, which contains the population mean. So, before you take a new sample you have 95% chance that confidence interval, computed around the sample mean, will contain the population mean.</p> <p>In this case we use Student's t-distribution to compute the interval. For given confidence level (e.g. 95%) and for given sample size (e.g. 5) we define a critical t-value \u2014\u00a0how many standard errors the interval will span on each side of the sample mean. E.g. for n = 5 this value is 2.78. You can see this value for current sample size in the table with statistics. If you have R you can also compute this value using ICDF function for t-distribution: <code>qt(0.975, 4)</code>. Here 0.975 is the right boundary of 95% interval and 4 is a number of degrees of freedom, which in this case is equal to <nobr>n - 1</nobr>.</p>"}]}, {"title": "Hypothesis testing", "apps": [{"id": "asta-b205", "title": "What is p-value?", "info": "Explanation of p-value using coin experiment.", "video": "https://www.youtube.com/embed/6O7rExp8tCQ", "help": "<h2>What is p-value?</h2><p>This app helps to understand the meaning of a p-value in hypotheses testing:</p> <p><em>p-value is a chance to get a sample as extreme as the one you have or even more extreme assuming that the null hypothesis (H0) is true.</em></p> <p>In case if all outcomes of an experiment are equally likely, to compute a p-value we need to know: <em>N1</em> \u2014 number of possible outcomes which will be as extreme as the one we currently have, <em>N2</em> \u2014 number of outcomes which will be more extreme for given H0, and <em>N</em> \u2014 total number of all possible outcomes. In this case the p-value can be computed as: <strong>p = (N1 + N2)/N</strong>.</p> <p>However, when we deal with continuous variables, number of possible outcomes is infinite and different outcomes may have different probabilities, therefore we have to use theoretical distributions for computing chances, which will be also shown in next apps. But in this app we introduce p-values based on experiment with limited number of outcomes \u2014\u00a0tossing a balanced coin several times (4 or 6). So we can count <em>N1</em>, <em>N2</em> and <em>N</em> and compute the p-value manually.</p>"}, {"id": "asta-b206", "title": "Test for sample proportion", "info": "How test for proportion works.", "video": "https://www.youtube.com/embed/zU3K4WWx7dI", "help": "<h2>Test for sample proportion</h2><p>This app visualizes a test for proportion of a sample \u2014 how likely the current sample came from population with given H0. In this case H0 is true, our population indeed has a proportion, \u03c0, which we set manually in the app (the population is shown on the left plot). So we expect that the test will confirm the H0 most of the time.</p> <p>Every time you take a new sample, app computes standard error and makes sampling distribution of possible        proportions around \u03c0 using the computed standard error and normal distribution. After that it evaluates how extreme your sample is and results in a p-value \u2014\u00a0chance to get a sample with proportion like you have or even more extreme assuming that H0 is true. If you take many samples, e.g. 200 or 300, then only 5% will have a p-value below 0.05, you can see all statistics right on the plot.</p> <p>However, this will work only if sample size is large enough. Try to set the population proportion to \u03c0 = 0.05 or 0.95. You will see that in this case even sample with n = 40 is too small for the test \u2014 sampling distribution curve will be truncated on one side. This leads to two problems \u2014\u00a0you will see an extreme p-value more often than expected and you have a chance to get a sample with members only from one group, so the sample proportion will be either 0 or 1. In this case standard error is 0 and there is no possibility to make a test. You need much larger sample to make a reliable test for such cases.</p>"}, {"id": "asta-b207", "title": "One sample t-test", "info": "Test for mean of one sample.", "video": "https://www.youtube.com/embed/PuIns8Y3gjI", "help": "<h2>One-sample t-test</h2><p>This app helps to understand how does the one sample t-test work. Here we have a normally distributed population \u2014 concentration of Chloride in different parts of a water source. The null hypothesis in this case is made about the population mean, \u00b5, and, depending on a tail, you have the following options \u2014 \"both\": H0: \u00b5 = 100 mg/L, \"left\": \u00b5 \u2265 100 mg/L, and \"right\": \u00b5 \u2264 100 mg/L. The population in this app has \u00b5 exactly equal to 100 mg/L, so all three hypothesis are true in this case. You have a possibility to change the standard deviation of the population, which by default is set to 3 mg/L but you will see, that it does not influence the outcome of the test.</p> <p>Then you can take a random sample from this population and see how far the mean of the sample is from the mean of the population. The app computes a chance to get a sample as extreme as given or even more extreme assuming that H0 is correct \u2014\u00a0the <strong>p-value</strong>. Usually p-value is used to assess how extreme your particular sample is for being taken from population where H0 is true. If p-value is small, it is considered as unlikely event and H0 is rejected.</p> <p>Often researchers use 5% (0.05) as a threshold for that. It is called <em>significance limit</em>. You will see that if you take many samples (100 or more), you will find out that approximately 5% of the samples will have p-value below 0.05 although the H0 is true. And this happens regardless the sample size. So this threshold is simply a chance to make a wrong decision by rejection the correct H0. So, if you use 0.05 you have 5% chance to make a wrong decision and e.g. \"see\" an effect, which does not exist.</p>"}, {"id": "asta-b208", "title": "Power of test and Type II error", "info": "How often you will be able to reject wrong H0.", "video": "https://www.youtube.com/embed/zUS5HDe5lMk", "help": "<h2>Power of test and Type II errors</h2> <p>This app is similar to <code>asta-b207</code> where you played with one-sample t-test. However, in this case you can emulate situations when H0 is not true, meaning the true population mean, \u00b5 is different from what you expect by setting H0. The possibilities for H0 are the same, depending on a tail, you have the following options \u2014 \"left\": \u00b5 \u2265 100 mg/L, and \"right\": \u00b5 \u2264 100 mg/L. But now you can also change the real population mean and set it to be smaller or larger than 100 mg/L.</p> <p>Try to do this and check how often you will be able to reject H0 (in this case we work with significance level 0.05, so we reject H0 when p-value is below this value). A probability to reject wrong H0 is called a <strong>power of test</strong>. And the situation when you can not reject it is called <strong>Type II</strong> error or false negative. The probability to get Type II error is always opposite to the power of test, e.g. if power is 80% you have 20% chance to make a Type II error.</p> <p>The power of any test depends on several things. First of all it is the test itself \u2014\u00a0different methods have different power. Second, it depends on the <strong>size of effect</strong> \u2014 difference between H0 mean and the real population mean (H1). E.g. if H0 assumes that \u00b5 \u2264 100 and the real \u00b5 = 105, this difference is 5. Finally, power also depends on standard deviation of your population as well as on the sample size. The last has very important consequence \u2014\u00a0the smaller effect you want to detect, the larger sample size should be.</p>"}]}, {"title": "Comparing means", "apps": [{"id": "asta-b209", "title": "Two sample t-test", "info": "How to compare mean of two samples.", "video": "https://www.youtube.com/embed/OEA5l04eVdU", "help": "<h2>Two sample t-test</h2><p>This app shows how to compare means of two samples. In this case the objective is to find out if the samples were taken from populations with the same means (H0: \u00b51 = \u00b52) or not (H1: \u00b51 \u2260 \u00b52). Here we use this test to see if increasing a temperature influence the yield of a chemical reaction. So, the population 1 consists of all possible outcomes of the reaction running at T = 120\u00baC. The population 2 consists of all possible outcomes of the reaction running at T = 160\u00baC. We assume that there are no other systematic factors involved so the variation of yield within each population is totally random and is distributed normally. The left plot shows the corresponding distributions using blue and red colors.</p> <p>By default \u00b51 = \u00b52 = 100 mg. Since \u00b51 \u2013 \u00b52 = 0, we can say that in this case <em>temperature does not have any effect on yield</em>. However, if we run the reactions just a few times (e.g. 3 for each temperature) you will always observe an effect and therefore you need to asses how likely you observe it just by chance.</p> <p>Use the app and investigate how often you will see an effect, which is not present and, vice versa, how often you will not be able to detect an existent effect. Check how the real (expected) effect size, noise and sample size influence this ability. The app works using significance level 0.05 but remember that for real applications it is better to use smaller value for the level.</p>"}, {"id": "asta-b210", "title": "Multiple comparison and Bonferroni correction", "info": "What if we apply t-test to more than 2 groups.", "video": "https://www.youtube.com/embed/1qh7Ibfeveg", "help": "<h2>Multiple t-test and Bonferroni correction</h2> <p>This app shows how to compare three samples taken from three populations. The three populations are all outcomes (yield measured in mg/L) of a chemical process running with a catalyst A, catalyst B and catalyst C. Here H0: \u00b5A = \u00b5B = \u00b5C = 100 mg/L. This means that regardless which catalyst we use, the average yield of the reaction is 100 mg/L, so changing catalyst has no effect on the yield. But when we run the reaction only 5 times for each catalyst, like shown in the app, the mean of these 5 runs will not be the same as the expected mean of the populations. And most of the time you will observe a difference among the sample means. Our goal is to use a t-test to test the H0 and make decision.</p> <p>However, t-test can be applied for comparing mean of two samples, while here we have three. One of the possibility will be to run t-test three times \u2014\u00a0one for each pair. This is what is called a <em>multiple compare</em> \u2014\u00a0you compare samples using several tests to check a single hypothesis. But the more tests you do the higher chance that you will reject correct H0. Try to run the test many times and you will see that although app works at significance limit 0.05 (so we expect that the H0 will be incorrectly rejected in 5% of cases), the real percent of rejections will be higher, about 10%.</p><p>You can overcome this problem by using Bonferroni correction, which decreases the significance limit in each individual tests, so the overall significance will be 0.05 (or any other pre-defined value). You can see the effect of correction by turning it on in the app and repeating the sampling many times again. In this case the significance level for individual tests will be set to 0.05/3 \u2248\u00a00.017 and the number of incorrectly rejected H0 will be around 5%.</p>"}, {"id": "asta-b211", "title": "One-way ANOVA (simplified)", "info": "How Analysis of Variance works for one factor.", "video": "https://www.youtube.com/embed/NMaIEHWkI5A", "help": "<h2>One way ANOVA</h2> <p>This app shows how one-way ANOVA tests means of three samples \u2014 the outcomes of a chemical reaction running using three different catalysis: <em>A</em>, <em>B</em> and <em>C</em>. We \"run\" the reaction with each catalyst 5 times, which gives 15 values \u2014 yield of each run in mg. The obtained yield values are shown in the top left table. The last row shows the average yield for each catalyst. You can adjust the expected effect for each catalyst and noise using slider controls.</p> <p>Then app computes a global mean for all original values and subtract it from the values thus creating a table with unbiased values, which are shown in the gray column. Table in the top of the column contains the unbiased values and their means. Under the table there are statistics: degrees of freedom (DoF), sum of squared values (SSQ) and variance or mean squares (MS = SSQ/DoF). Plot below shows boxplots for populations and points for the values.</p> <p>After that we split the unbiased values into a sum of <em>systematic</em> part, shown in the green column, and the <em>residuals</em>,\u00a0shown in the red column. In the systematic part we assume there is no noise, so all outcomes for given factor level (e.g. column A) have the same value \u2014 the corresponding mean. Residuals are computed as a difference between the unbiased values and the systematic part. App computes DoF, SSQ and MS for each part and the F-value \u2014\u00a0which is a ratio of MS for systematic part and residuals. The F-value follows F-distribution shown under the original data table. We use this distribution to compute corresponding p-value and make decision about the H0.</p>"}, {"id": "asta-b212", "title": "One-way ANOVA (full)", "info": "A more detailed app.", "video": "https://www.youtube.com/embed/k738X17uNUc", "help": "<h2>One way ANOVA (full)</h2> <p>This app is almost identical to the <code>asta-b211</code> but here we show calculations as they are without subtracting the global mean in advance. The results are absolutely identical but this time without additional step of unbiasing the values. Plus the app shows importance of QQ plot for residuals which helps to assess their normality.</p>"}]}, {"title": "Relationship between two variables", "apps": [{"id": "asta-b301", "title": "Covariance", "info": "How to compute and understand the covariance.", "video": "", "help": "<h2>Covariance</h2> <p>This app helps to understand covariance \u2014\u00a0a statistic which tells if two variables, <em>x</em> and <em>y</em> have a linear relationship (co-vary). If covariance is positive, then increasing <em>x</em> will likely lead to increasing of <em>y</em> value and vice versa. To compute the covariance, we first calculate distance from x- and y-value of a data point to corresponding means and then take a product of the two distances. The covariance is a sum of the distance products divided to the number of degrees of freedom (n - 1). You can see all these calculations in a table.</p> <p> Try to change parameters of a population: amount of noise and a slope of best fit line which has mean values as the origin. You will see how this influences your sample, and the sample co-variance. If product of two distances is positive this point contributes positively to the covariance and such point and the corresponding row in the table is shown using red color. If product of the two distances is negative \u2014\u00a0blue color is used.</p>"}, {"id": "asta-b302", "title": "Correlation and population based CI", "info": "Pearson's correlation coefficient and population based CI.", "video": "", "help": "<h2>Correlation and population based confidence interval</h2> <p>This app helps you to understand the Pearson's correlation coefficient, <em>r(x,y)</em>, which is computed as covariance for standardized <em>x</em> and <em>y</em> values. Alternatively you can compute covariance for the original values and then standardize the covariance by dividing it to the standard deviation of  <em>x</em> and <em>y</em>. If there is no noise at all, and <em>y</em> is linearly dependent on <em>x</em>, the correlation does not depend on slope of the line. However, when noise is present, the slope has an influence which you can see by playing with the app. The right column in the table with statistics (shown as gray) shows values for population, the middle column shows values for a current sample.</p> <p>The uncertainty for correlation coefficient of a sample depends both on the correlation of population and the sample size. The sample correlation coefficient does not follow any theoretical distribution, therefore for computing the uncertainty and corresponding confidence interval, a <a href=\"https://en.wikipedia.org/wiki/Fisher_transformation\">transformed statistic</a>, <em>z'</em>, is used. This statistic follows normal distribution if n > 10. The app shows how the distribution of <em>z'</em> looks like for different levels of noise and how it can be transformed back to distribution of <em>r</em> values.</p>"}, {"id": "asta-b303", "title": "Correlation and sample based CI", "info": "Pearson's correlation coefficient and sample based CI.", "video": "", "help": "<h2>Correlation and sample based confidence interval</h2> <p>This app is almost identical to the previous one (asta-b302) with one important difference: confidence interval in this app is computed based on statistics of a current sample. So, you can see how confidence interval vary from one sample to another and how often the correlation coefficient of population (or it's trasformed value, z') will be inside the interval.</p> <p>Because the confidence intervals in this app are computed for 95% confidence level, you can expect that in 95% of all cases sample will contain the population parameter inside the interval. However, you will see exactly 95%, only if you take a large amount of samples, several hundreds or even thousands. This is similar to confidence intervals computed for other statistics, e.g. mean or proportion.</p>"}, {"id": "asta-b304", "title": "Simple linear regression", "info": "SLR and its main outcomes.", "video": "", "help": "<h2>Simple linear regression</h2> <p>The app shows how to use simple linear regression for investigation of relationship between two variables (in this case height and weight of adult persons). The plot shows data points both for population (N = 500) and current sample (n = 10). Both sets of points are fitted by a simple linear regression model, you can see both models in form of lines and the corresponding equations, as well as their characteristics (standard error of  prediction and coefficient of determination, R2). The table on the right part of the app shows reference y-values, values, predicted by the model, error of prediction and its square. Sum of squared errors is what is used to compute both standard error and R2.</p> <p>The shaded area on the plot shows uncertainties. By default you see uncertainty from both fitting and sampling error. You can use the switch to see uncertainty from one of the source. You can also change the amount of noise (the more noise, the less percent of y-variance can be predicted by the model) and see how it changes the uncertainties. Plus you can select any sample point on the plot and see the predicted value and the uncertainty interval for this point.</p>"}, {"id": "asta-b305", "title": "Sampling error and overfitting", "info": "How sampling error depends on sample size and model complexity.", "video": "", "help": "<h2>Sampling error and overfitting</h2> <p>This app shows how sample size and complexity of a regression model influence the sampling error. Sampling error in this case can be defined as variation of regression coefficients of a model, trained on a sample, around the \"true\" regression coefficients of a model trained on the population points. This app uses polynomial model for regression \u2014 the higher polynomial degree the higher the model complexity.</p> <p>Just set the desired sample size and the polynomial degree and then start collecting new samples. Points and model for the current sample are shown using red color for better contrast. The models for all previous samples are kept on the main plot (they are also red but semi transparent), so you can see how big the variation of the models is.</p> <p>The small plot on the right shows regression coefficients. The semi-transparent blue bars show the \"true\" regression coefficients for the population. Red points are regression coefficients of current and all previous samples. So you can see how big the variation of the coefficients is and how it depends on sample size and model complexity.</p>"}, {"id": "asta-b306", "title": "Cross-validation", "info": "Cross-validation, model performance and overfitting.", "video": "", "help": "<h2>Cross-validation</h2> <p>Cross-validation is a way to estimate the sampling error without taking new samples from the population. The idea is to split your original observations to several segments and then, for each segment, make a local model by taking the segment observations out of the dataset, and use the rest for training the model. After that, the local model is used to predict the response values of the excluded observations. The procedure is repeated for each segment, so at the end every observation will have a predicted response value (<em>y</em><sub>cv</sub>).</p> <p>Splitting the observations into segments can be done in several ways. The simplest is to consider every observation as individual segment. In this case the number of segments is equal to the number of observations and thus on every step one observation will be taking out, while the rest will be used for training the local model. This way is called <em>leave-one-out</em> or <em>full cross-validation</em>. Alternatively you can assign two or more observations to each segment. This can be done randomly (<em>random segmented cross-validation</em>) or systematically by taking every k-th observation (<em>venetian blinds</em>).</p> <p>This app shows how all three methods work for a simple dataset with 12 observations. If random or systematic split is selected, number of segments will be equal to 4. Cross-validation can help to detect overfitting, you can also test this in the app \u2014\u00a0try to use overfitted model, e.g. cubic polynomial and will see that despite the calibration error is getting smaller, the cross-validation error will be larger for overcomplicated models.</p>"}, {"id": "asta-b307", "title": "Jackknifing", "info": "Jackknife resampling for regression coefficients.", "video": "", "help": "<h2>Jackknife resampling for regression coefficients</h2><p>Jackknife resampling is a way to make an inference (e.g. compute confidence intervals of find a p-value for H0: \u03b2 = 0) for regression coefficients based on full cross-validation. The idea is to estimate a variance of regression coefficients computed for each local model (every time we take one sample out, we compute a new model, which is called <em>local</em>) and then compute the standard error for the coefficient based on this variance.</p> <p> In this app population consists of 500 measurements of <em>x</em> and <em>y</em>, where <em>y</em> linearly depends on <em>x</em>. However, if you take a small sample (in this app the sample size is fixed to <em>n</em> = 12), it can have a random non-linear effect in the <em>y</em>(<em>x</em>) relationship, so when this sample is fitted by a polynomial model, the regression coefficients for quadratic or cubic terms will not be zero. But if you use Jackknife, then most of the time it will be able to detect that the estimated coefficients are in fact not significant, so statistically they are not distinguishable from zero.</p> <p> In order to investigate this, set polynomial to <em>cubic</em> and take a sample where the last two regression coefficients will be relatively large, so you can see them as small blue bars on the coefficients' plot. Then run the cross-validation procedure and see how all coefficients vary for the local models. At the end you will see errorbars which correspond to 95% confidence intervals and for the non-linear terms, most of the time, the interval will cross zero.</p>"}]}];

    /* src/App.svelte generated by Svelte v3.48.0 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (101:0) {#if demoOn && appInfo}
    function create_if_block(ctx) {
    	let appdemo;
    	let current;
    	const appdemo_spread_levels = [/*appInfo*/ ctx[4], { tab: /*demoTab*/ ctx[3] }];
    	let appdemo_props = {};

    	for (let i = 0; i < appdemo_spread_levels.length; i += 1) {
    		appdemo_props = assign(appdemo_props, appdemo_spread_levels[i]);
    	}

    	appdemo = new AppDemo({ props: appdemo_props, $$inline: true });
    	appdemo.$on("close", /*close_handler*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(appdemo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appdemo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appdemo_changes = (dirty & /*appInfo, demoTab*/ 24)
    			? get_spread_update(appdemo_spread_levels, [
    					dirty & /*appInfo*/ 16 && get_spread_object(/*appInfo*/ ctx[4]),
    					dirty & /*demoTab*/ 8 && { tab: /*demoTab*/ ctx[3] }
    				])
    			: {};

    			appdemo.$set(appdemo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appdemo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appdemo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appdemo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(101:0) {#if demoOn && appInfo}",
    		ctx
    	});

    	return block;
    }

    // (113:0) {#each appBlocksShow.filter(v => v.apps.length > 0) as appBlock}
    function create_each_block(ctx) {
    	let appblock;
    	let current;
    	const appblock_spread_levels = [/*appBlock*/ ctx[15]];
    	let appblock_props = {};

    	for (let i = 0; i < appblock_spread_levels.length; i += 1) {
    		appblock_props = assign(appblock_props, appblock_spread_levels[i]);
    	}

    	appblock = new AppBlock({ props: appblock_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(appblock.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(appblock, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const appblock_changes = (dirty & /*appBlocksShow*/ 2)
    			? get_spread_update(appblock_spread_levels, [get_spread_object(/*appBlock*/ ctx[15])])
    			: {};

    			appblock.$set(appblock_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(appblock.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(appblock.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(appblock, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(113:0) {#each appBlocksShow.filter(v => v.apps.length > 0) as appBlock}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let div;
    	let input;
    	let t1;
    	let button;
    	let t3;
    	let span;
    	let t4;
    	let t5;
    	let each_1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*demoOn*/ ctx[2] && /*appInfo*/ ctx[4] && create_if_block(ctx);
    	let each_value = /*appBlocksShow*/ ctx[1].filter(func);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "×";
    			t3 = space();
    			span = element("span");
    			t4 = text(/*appListInfo*/ ctx[5]);
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(input, "placeholder", "Enter a single keyword (e.g. interval)");
    			attr_dev(input, "class", "svelte-12lrilt");
    			add_location(input, file, 106, 3, 3288);
    			attr_dev(button, "class", "svelte-12lrilt");
    			toggle_class(button, "hidden", /*searchStr*/ ctx[0].length < 1);
    			add_location(button, file, 107, 3, 3402);
    			attr_dev(span, "class", "svelte-12lrilt");
    			add_location(span, file, 108, 3, 3506);
    			attr_dev(div, "class", "search-block svelte-12lrilt");
    			add_location(div, file, 105, 0, 3258);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*searchStr*/ ctx[0]);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(div, t3);
    			append_dev(div, span);
    			append_dev(span, t4);
    			insert_dev(target, t5, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "load", /*routeChange*/ ctx[7], false, false, false),
    					listen_dev(window, "hashchange", /*routeChange*/ ctx[7], false, false, false),
    					listen_dev(input, "keydown", /*resetSearch*/ ctx[6], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10]),
    					listen_dev(button, "click", /*click_handler*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*demoOn*/ ctx[2] && /*appInfo*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*demoOn, appInfo*/ 20) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*searchStr*/ 1 && input.value !== /*searchStr*/ ctx[0]) {
    				set_input_value(input, /*searchStr*/ ctx[0]);
    			}

    			if (dirty & /*searchStr*/ 1) {
    				toggle_class(button, "hidden", /*searchStr*/ ctx[0].length < 1);
    			}

    			if (!current || dirty & /*appListInfo*/ 32) set_data_dev(t4, /*appListInfo*/ ctx[5]);

    			if (dirty & /*appBlocksShow*/ 2) {
    				each_value = /*appBlocksShow*/ ctx[1].filter(func);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = v => v.apps.length > 0;

    function instance($$self, $$props, $$invalidate) {
    	let appBlocksShow;
    	let numApps;
    	let appListInfo;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let demoOn = false; // status for demo window
    	let demoTab = ""; // current tab for demo window
    	let appInfo = undefined; // current app for demo window
    	let searchStr = ""; // seach string with keyword

    	// shows demo modal window with the app
    	function showDemo(id, tab) {
    		$$invalidate(4, appInfo = getAppInfoById(id));

    		// no app found - clean the hash url and return
    		if (!appInfo) {
    			location.hash = "";
    			return;
    		}

    		// check that tab name is correct, if not - force tab to "app"
    		if (!["app", "video", "info"].includes(tab)) tab = "app";

    		// if tabe name is "video" but video is not available - force tab to "app"
    		if (tab == "video" && appInfo.video === "") tab = "app";

    		// show the modal with app demo
    		$$invalidate(2, demoOn = true);

    		$$invalidate(3, demoTab = tab ? tab : "app");
    		document.querySelector("body").style.overflow = "hidden";
    	}

    	// closes demo modal window and cleans all related parameters
    	function closeDemo(e) {
    		document.querySelector("body").style.overflow = "auto";
    		$$invalidate(2, demoOn = false);
    		location.hash = "";
    		$$invalidate(3, demoTab = "");
    		$$invalidate(4, appInfo = undefined);
    	}

    	// cleans search results
    	function resetSearch(e = undefined) {
    		if (e === undefined || e.key === 'Escape') $$invalidate(0, searchStr = "");
    	}

    	// search the app by ID and returns its details
    	function getAppInfoById(id) {
    		const res = appBlocks.// in every app block search for app by its ID
    		map(v => ({
    			apps: v.apps.filter(a => "#" + a.id === id)
    		})).// remove empty blocks and extract app info
    		filter(v => v.apps.length > 0);

    		if (res.length === 0 || res[0].apps.length === 0) return null;
    		return res[0].apps[0];
    	}

    	// detect changes in hash url and do routing
    	function routeChange() {
    		// no hash - close demo
    		if (location.hash === "") {
    			if (demoOn) closeDemo();
    			return;
    		}

    		// parse URL to get app ID and tab name if any
    		const hashElements = location.hash.split("/");

    		const appId = hashElements[0];
    		const demoTab = hashElements[1];

    		// no app found - close demo if any and return
    		if (appId === "") {
    			if (demoOn) closeDemo();
    			return;
    		}

    		showDemo(appId, demoTab);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const close_handler = () => location.hash = "";

    	function input_input_handler() {
    		searchStr = this.value;
    		$$invalidate(0, searchStr);
    	}

    	const click_handler = () => resetSearch(undefined);

    	$$self.$capture_state = () => ({
    		AppBlock,
    		AppDemo,
    		appBlocks,
    		demoOn,
    		demoTab,
    		appInfo,
    		searchStr,
    		showDemo,
    		closeDemo,
    		resetSearch,
    		getAppInfoById,
    		routeChange,
    		numApps,
    		appListInfo,
    		appBlocksShow
    	});

    	$$self.$inject_state = $$props => {
    		if ('demoOn' in $$props) $$invalidate(2, demoOn = $$props.demoOn);
    		if ('demoTab' in $$props) $$invalidate(3, demoTab = $$props.demoTab);
    		if ('appInfo' in $$props) $$invalidate(4, appInfo = $$props.appInfo);
    		if ('searchStr' in $$props) $$invalidate(0, searchStr = $$props.searchStr);
    		if ('numApps' in $$props) $$invalidate(8, numApps = $$props.numApps);
    		if ('appListInfo' in $$props) $$invalidate(5, appListInfo = $$props.appListInfo);
    		if ('appBlocksShow' in $$props) $$invalidate(1, appBlocksShow = $$props.appBlocksShow);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchStr*/ 1) {
    			// interactive search procedure
    			$$invalidate(1, appBlocksShow = searchStr.length > 1
    			? appBlocks.map(v => ({
    					title: v.title,
    					apps: v.apps.filter(a => a.title.toLowerCase().search(searchStr.toLowerCase()) >= 0 | a.info.toLowerCase().search(searchStr.toLowerCase()) >= 0)
    				}))
    			: appBlocks);
    		}

    		if ($$self.$$.dirty & /*appBlocksShow*/ 2) {
    			$$invalidate(8, numApps = appBlocksShow.reduce((v, c) => parseInt(v) + c.apps.length, 0));
    		}

    		if ($$self.$$.dirty & /*searchStr, numApps*/ 257) {
    			$$invalidate(5, appListInfo = searchStr.length > 0
    			? `Found ${numApps} app${numApps > 1 ? "s" : ""}`
    			: `${numApps} apps in the list.`);
    		}
    	};

    	return [
    		searchStr,
    		appBlocksShow,
    		demoOn,
    		demoTab,
    		appInfo,
    		appListInfo,
    		resetSearch,
    		routeChange,
    		numApps,
    		close_handler,
    		input_input_handler,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({target: document.getElementById("app-list"),});

    return app;

})();
//# sourceMappingURL=bundle.js.map
