
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
	'use strict';

	function noop() {}

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

	function validate_store(store, name) {
		if (!store || typeof store.subscribe !== 'function') {
			throw new Error(`'${name}' is not a store with a 'subscribe' method`);
		}
	}

	function subscribe(component, store, callback) {
		const unsub = store.subscribe(callback);

		component.$$.on_destroy.push(unsub.unsubscribe
			? () => unsub.unsubscribe()
			: unsub);
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
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

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function prevent_default(fn) {
		return function(event) {
			event.preventDefault();
			return fn.call(this, event);
		};
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function to_number(value) {
		return value === '' ? undefined : +value;
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function toggle_class(element, name, toggle) {
		element.classList[toggle ? 'add' : 'remove'](name);
	}

	function custom_event(type, detail) {
		const e = document.createEvent('CustomEvent');
		e.initCustomEvent(type, false, false, detail);
		return e;
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	function createEventDispatcher() {
		const component = current_component;

		return (type, detail) => {
			const callbacks = component.$$.callbacks[type];

			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(type, detail);
				callbacks.slice().forEach(fn => {
					fn.call(component, event);
				});
			}
		};
	}

	// TODO figure out if we still want to support
	// shorthand events, or if we want to implement
	// a real bubbling mechanism
	function bubble(component, event) {
		const callbacks = component.$$.callbacks[event.type];

		if (callbacks) {
			callbacks.slice().forEach(fn => fn(event));
		}
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = blank_object();
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	function noop$1() {}

	function safe_not_equal$1(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}
	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 * @param value initial value
	 * @param start start and stop notifications for subscriptions
	 */
	function writable(value, start = noop$1) {
	    let stop;
	    const subscribers = [];
	    function set(new_value) {
	        if (safe_not_equal$1(value, new_value)) {
	            value = new_value;
	            if (!stop) {
	                return; // not ready
	            }
	            subscribers.forEach((s) => s[1]());
	            subscribers.forEach((s) => s[0](value));
	        }
	    }
	    function update(fn) {
	        set(fn(value));
	    }
	    function subscribe$$1(run$$1, invalidate = noop$1) {
	        const subscriber = [run$$1, invalidate];
	        subscribers.push(subscriber);
	        if (subscribers.length === 1) {
	            stop = start(set) || noop$1;
	        }
	        run$$1(value);
	        return () => {
	            const index = subscribers.indexOf(subscriber);
	            if (index !== -1) {
	                subscribers.splice(index, 1);
	            }
	            if (subscribers.length === 0) {
	                stop();
	            }
	        };
	    }
	    return { set, update, subscribe: subscribe$$1 };
	}

	const activePlayer = writable('X');

	/* src/components/Cell.svelte generated by Svelte v3.4.2 */

	const file = "src/components/Cell.svelte";

	function create_fragment(ctx) {
		var button, dispose;

		return {
			c: function create() {
				button = element("button");
				button.className = "svelte-1xgiiod";
				toggle_class(button, "inactive", !ctx.active);
				toggle_class(button, "x", ctx.player === 'X');
				toggle_class(button, "o", ctx.player === 'O');
				add_location(button, file, 106, 0, 1858);
				dispose = listen(button, "click", ctx.makeStep);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
			},

			p: function update(changed, ctx) {
				if (changed.active) {
					toggle_class(button, "inactive", !ctx.active);
				}

				if (changed.player) {
					toggle_class(button, "x", ctx.player === 'X');
					toggle_class(button, "o", ctx.player === 'O');
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				dispose();
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let $activePlayer;

		validate_store(activePlayer, 'activePlayer');
		subscribe($$self, activePlayer, $$value => { $activePlayer = $$value; $$invalidate('$activePlayer', $activePlayer); });

		

	  let { row, col } = $$props;
	  let active = true;
	  let player = '';
	  const dispatch = createEventDispatcher();

	  function makeStep() {
	    if (active) {
	      $$invalidate('active', active = false);
	      $$invalidate('player', player = $activePlayer);
	      dispatch('step', { row, col });
	    }
	  }

		$$self.$set = $$props => {
			if ('row' in $$props) $$invalidate('row', row = $$props.row);
			if ('col' in $$props) $$invalidate('col', col = $$props.col);
		};

		return { row, col, active, player, makeStep };
	}

	class Cell extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, ["row", "col"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.row === undefined && !('row' in props)) {
				console.warn("<Cell> was created without expected prop 'row'");
			}
			if (ctx.col === undefined && !('col' in props)) {
				console.warn("<Cell> was created without expected prop 'col'");
			}
		}

		get row() {
			throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set row(value) {
			throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get col() {
			throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set col(value) {
			throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Board.svelte generated by Svelte v3.4.2 */

	const file$1 = "src/components/Board.svelte";

	function get_each_context_1(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.null = list[i].null;
		child_ctx.col = i;
		return child_ctx;
	}

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.null = list[i].null;
		child_ctx.row = i;
		return child_ctx;
	}

	// (28:6) {#each scaleArr as {}
	function create_each_block_1(ctx) {
		var current;

		var cell = new Cell({
			props: { row: ctx.row, col: ctx.col },
			$$inline: true
		});
		cell.$on("step", ctx.step_handler);

		return {
			c: function create() {
				cell.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(cell, target, anchor);
				current = true;
			},

			p: noop,

			i: function intro(local) {
				if (current) return;
				cell.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				cell.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				cell.$destroy(detaching);
			}
		};
	}

	// (26:2) {#each scaleArr as {}
	function create_each_block(ctx) {
		var div, t, current;

		var each_value_1 = ctx.scaleArr;

		var each_blocks = [];

		for (var i = 0; i < each_value_1.length; i += 1) {
			each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		function outro_block(i, detaching, local) {
			if (each_blocks[i]) {
				if (detaching) {
					on_outro(() => {
						each_blocks[i].d(detaching);
						each_blocks[i] = null;
					});
				}

				each_blocks[i].o(local);
			}
		}

		return {
			c: function create() {
				div = element("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t = space();
				div.className = "row svelte-syzx79";
				add_location(div, file$1, 26, 4, 394);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div, null);
				}

				append(div, t);
				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.scaleArr) {
					each_value_1 = ctx.scaleArr;

					for (var i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
							each_blocks[i].i(1);
						} else {
							each_blocks[i] = create_each_block_1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].i(1);
							each_blocks[i].m(div, t);
						}
					}

					group_outros();
					for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				for (var i = 0; i < each_value_1.length; i += 1) each_blocks[i].i();

				current = true;
			},

			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);
				for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	function create_fragment$1(ctx) {
		var main, current;

		var each_value = ctx.scaleArr;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		function outro_block(i, detaching, local) {
			if (each_blocks[i]) {
				if (detaching) {
					on_outro(() => {
						each_blocks[i].d(detaching);
						each_blocks[i] = null;
					});
				}

				each_blocks[i].o(local);
			}
		}

		return {
			c: function create() {
				main = element("main");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				main.className = "board svelte-syzx79";
				add_location(main, file$1, 24, 0, 339);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, main, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(main, null);
				}

				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.scaleArr) {
					each_value = ctx.scaleArr;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
							each_blocks[i].i(1);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].i(1);
							each_blocks[i].m(main, null);
						}
					}

					group_outros();
					for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

				current = true;
			},

			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);
				for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(main);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { scale } = $$props;
	  let scaleArr = [];

		function step_handler(event) {
			bubble($$self, event);
		}

		$$self.$set = $$props => {
			if ('scale' in $$props) $$invalidate('scale', scale = $$props.scale);
		};

		$$self.$$.update = ($$dirty = { scale: 1, scaleArr: 1 }) => {
			if ($$dirty.scale || $$dirty.scaleArr) { for (let i = 0; i < scale; i++) {
	        scaleArr.push(i);
	      } }
		};

		return { scale, scaleArr, step_handler };
	}

	class Board extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, ["scale"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.scale === undefined && !('scale' in props)) {
				console.warn("<Board> was created without expected prop 'scale'");
			}
		}

		get scale() {
			throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set scale(value) {
			throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/Setup.svelte generated by Svelte v3.4.2 */

	const file$2 = "src/components/Setup.svelte";

	function create_fragment$2(ctx) {
		var form, label, span, input, t_1, button, dispose;

		return {
			c: function create() {
				form = element("form");
				label = element("label");
				span = element("span");
				span.textContent = "Размер поля:";
				input = element("input");
				t_1 = space();
				button = element("button");
				button.textContent = "Начать игру";
				span.className = "svelte-nvj5hp";
				add_location(span, file$2, 37, 4, 615);
				attr(input, "type", "number");
				input.min = "3";
				input.max = "15";
				input.className = "svelte-nvj5hp";
				add_location(input, file$2, 37, 29, 640);
				label.className = "svelte-nvj5hp";
				add_location(label, file$2, 36, 2, 603);
				button.className = "btn";
				button.type = "submit";
				add_location(button, file$2, 39, 2, 714);
				form.className = "svelte-nvj5hp";
				add_location(form, file$2, 35, 0, 557);

				dispose = [
					listen(input, "input", ctx.input_input_handler),
					listen(form, "submit", prevent_default(ctx.startGame))
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, form, anchor);
				append(form, label);
				append(label, span);
				append(label, input);

				input.value = ctx.scale;

				append(form, t_1);
				append(form, button);
			},

			p: function update(changed, ctx) {
				if (changed.scale) input.value = ctx.scale;
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(form);
				}

				run_all(dispose);
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		const dispatch = createEventDispatcher();
	  let scale = 3;

	  function startGame() {
	    dispatch('start', scale);
	  }

		function input_input_handler() {
			scale = to_number(this.value);
			$$invalidate('scale', scale);
		}

		return { scale, startGame, input_input_handler };
	}

	class Setup extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
		}
	}

	/* src/components/Score.svelte generated by Svelte v3.4.2 */

	const file$3 = "src/components/Score.svelte";

	function create_fragment$3(ctx) {
		var header, h1, t1, div, span0, t2_value = ctx.wins.O, t2, t3, t4, span1, t5, t6, t7, span2, t8_value = ctx.wins.X, t8, t9;

		return {
			c: function create() {
				header = element("header");
				h1 = element("h1");
				h1.textContent = "Крестики нолики";
				t1 = space();
				div = element("div");
				span0 = element("span");
				t2 = text(t2_value);
				t3 = text(" побед ноликов");
				t4 = space();
				span1 = element("span");
				t5 = text("Матч № ");
				t6 = text(ctx.matches);
				t7 = space();
				span2 = element("span");
				t8 = text(t8_value);
				t9 = text(" побед крестиков");
				h1.className = "svelte-w4jdqy";
				add_location(h1, file$3, 28, 2, 367);
				span0.className = "svelte-w4jdqy";
				add_location(span0, file$3, 32, 4, 425);
				span1.className = "svelte-w4jdqy";
				add_location(span1, file$3, 35, 4, 477);
				span2.className = "svelte-w4jdqy";
				add_location(span2, file$3, 38, 4, 523);
				div.className = "info svelte-w4jdqy";
				add_location(div, file$3, 31, 2, 402);
				header.className = "svelte-w4jdqy";
				add_location(header, file$3, 27, 0, 356);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, header, anchor);
				append(header, h1);
				append(header, t1);
				append(header, div);
				append(div, span0);
				append(span0, t2);
				append(span0, t3);
				append(div, t4);
				append(div, span1);
				append(span1, t5);
				append(span1, t6);
				append(div, t7);
				append(div, span2);
				append(span2, t8);
				append(span2, t9);
			},

			p: function update(changed, ctx) {
				if ((changed.wins) && t2_value !== (t2_value = ctx.wins.O)) {
					set_data(t2, t2_value);
				}

				if (changed.matches) {
					set_data(t6, ctx.matches);
				}

				if ((changed.wins) && t8_value !== (t8_value = ctx.wins.X)) {
					set_data(t8, t8_value);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(header);
				}
			}
		};
	}

	function instance$3($$self, $$props, $$invalidate) {
		let { matches = 0, wins = {} } = $$props;

		$$self.$set = $$props => {
			if ('matches' in $$props) $$invalidate('matches', matches = $$props.matches);
			if ('wins' in $$props) $$invalidate('wins', wins = $$props.wins);
		};

		return { matches, wins };
	}

	class Score extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, ["matches", "wins"]);
		}

		get matches() {
			throw new Error("<Score>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set matches(value) {
			throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get wins() {
			throw new Error("<Score>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set wins(value) {
			throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/App.svelte generated by Svelte v3.4.2 */

	const file$4 = "src/App.svelte";

	// (146:2) {:else}
	function create_else_block(ctx) {
		var div, t, button, dispose;

		function select_block_type_1(ctx) {
			if (ctx.gameStatus == 'win') return create_if_block_2;
			return create_else_block_1;
		}

		var current_block_type = select_block_type_1(ctx);
		var if_block = current_block_type(ctx);

		return {
			c: function create() {
				div = element("div");
				if_block.c();
				t = space();
				button = element("button");
				button.textContent = "Начать новую игру";
				button.className = "btn";
				add_location(button, file$4, 152, 6, 3122);
				div.className = "results svelte-185yusv";
				add_location(div, file$4, 146, 4, 2963);
				dispose = listen(button, "click", ctx.restart);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				if_block.m(div, null);
				append(div, t);
				append(div, button);
			},

			p: function update(changed, ctx) {
				if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(div, t);
					}
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				if_block.d();
				dispose();
			}
		};
	}

	// (141:33) 
	function create_if_block_1(ctx) {
		var div, p, t0, t1, t2, t3, t4, current;

		var board_1 = new Board({
			props: { scale: ctx.scale },
			$$inline: true
		});
		board_1.$on("step", ctx.makeStep);

		return {
			c: function create() {
				div = element("div");
				p = element("p");
				t0 = text("Ход №");
				t1 = text(ctx.moves);
				t2 = text(" игрок - ");
				t3 = text(ctx.$activePlayer);
				t4 = space();
				board_1.$$.fragment.c();
				add_location(p, file$4, 142, 6, 2846);
				div.className = "info svelte-185yusv";
				add_location(div, file$4, 141, 4, 2821);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, p);
				append(p, t0);
				append(p, t1);
				append(p, t2);
				append(p, t3);
				insert(target, t4, anchor);
				mount_component(board_1, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (!current || changed.moves) {
					set_data(t1, ctx.moves);
				}

				if (!current || changed.$activePlayer) {
					set_data(t3, ctx.$activePlayer);
				}

				var board_1_changes = {};
				if (changed.scale) board_1_changes.scale = ctx.scale;
				board_1.$set(board_1_changes);
			},

			i: function intro(local) {
				if (current) return;
				board_1.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				board_1.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
					detach(t4);
				}

				board_1.$destroy(detaching);
			}
		};
	}

	// (139:2) { #if gameStatus == 'start'}
	function create_if_block(ctx) {
		var current;

		var setup = new Setup({ $$inline: true });
		setup.$on("start", ctx.startGame);

		return {
			c: function create() {
				setup.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(setup, target, anchor);
				current = true;
			},

			p: noop,

			i: function intro(local) {
				if (current) return;
				setup.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				setup.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				setup.$destroy(detaching);
			}
		};
	}

	// (150:8) {:else}
	function create_else_block_1(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "Ничья";
				add_location(p, file$4, 150, 8, 3091);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	// (148:6) { #if gameStatus == 'win'}
	function create_if_block_2(ctx) {
		var p, t0, t1, t2;

		return {
			c: function create() {
				p = element("p");
				t0 = text("Игрок ");
				t1 = text(ctx.notActivePlayer);
				t2 = text(" победил");
				add_location(p, file$4, 148, 8, 3026);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
				append(p, t0);
				append(p, t1);
				append(p, t2);
			},

			p: function update(changed, ctx) {
				if (changed.notActivePlayer) {
					set_data(t1, ctx.notActivePlayer);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	function create_fragment$4(ctx) {
		var div, t, current_block_type_index, if_block, current;

		var score = new Score({
			props: {
			matches: ctx.matches,
			",": true,
			wins: ctx.wins
		},
			$$inline: true
		});

		var if_block_creators = [
			create_if_block,
			create_if_block_1,
			create_else_block
		];

		var if_blocks = [];

		function select_block_type(ctx) {
			if (ctx.gameStatus == 'start') return 0;
			if (ctx.gameStatus == 'turn') return 1;
			return 2;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		return {
			c: function create() {
				div = element("div");
				score.$$.fragment.c();
				t = space();
				if_block.c();
				div.id = "app";
				div.className = "svelte-185yusv";
				add_location(div, file$4, 136, 0, 2660);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				mount_component(score, div, null);
				append(div, t);
				if_blocks[current_block_type_index].m(div, null);
				current = true;
			},

			p: function update(changed, ctx) {
				var score_changes = {};
				if (changed.matches) score_changes.matches = ctx.matches;
				if (changed.wins) score_changes.wins = ctx.wins;
				score.$set(score_changes);

				var previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);
				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(changed, ctx);
				} else {
					group_outros();
					on_outro(() => {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});
					if_block.o(1);
					check_outros();

					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					if_block.i(1);
					if_block.m(div, null);
				}
			},

			i: function intro(local) {
				if (current) return;
				score.$$.fragment.i(local);

				if (if_block) if_block.i();
				current = true;
			},

			o: function outro(local) {
				score.$$.fragment.o(local);
				if (if_block) if_block.o();
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				score.$destroy();

				if_blocks[current_block_type_index].d();
			}
		};
	}

	function instance$4($$self, $$props, $$invalidate) {
		let $activePlayer;

		validate_store(activePlayer, 'activePlayer');
		subscribe($$self, activePlayer, $$value => { $activePlayer = $$value; $$invalidate('$activePlayer', $activePlayer); });

		

	  let matches = 0;
	  let wins = { O: 0, X: 0 };
	  let scale = 3;
	  let gameStatus = 'start';
	  let board = {};
	  let mirrorBoard = {};
	  let moves = 0;

	  function startGame(event) {
	    $$invalidate('scale', scale = event.detail);
	    $$invalidate('gameStatus', gameStatus = 'turn');
	  }

	  function restart() {
	    $$invalidate('scale', scale = 0);
	    $$invalidate('moves', moves = 0);
	    $$invalidate('gameStatus', gameStatus = 'start');
	  }

	  function makeStep(event) {
	    moves++; $$invalidate('moves', moves);
	    updateBoards(event.detail);
	    updateGameStatus();
	    updateActivePlayer();
	  }

	  function updateBoards(info) {
	    board[info.row][info.col] = $activePlayer; $$invalidate('board', board), $$invalidate('scale', scale);
	    mirrorBoard[info.col][info.row] = $activePlayer; $$invalidate('mirrorBoard', mirrorBoard), $$invalidate('scale', scale);
	  }

	  function updateGameStatus() {
	    if (isActivePlayerWin()) {
	      $$invalidate('gameStatus', gameStatus = 'win');
	      matches++; $$invalidate('matches', matches);
	      wins[$activePlayer]++; $$invalidate('wins', wins);
	    }

	    else if (moves === scale * scale) {
	      $$invalidate('gameStatus', gameStatus = 'draw');
	      matches++; $$invalidate('matches', matches);
	    }
	  }

	  function updateActivePlayer() {
	    activePlayer.update(() => notActivePlayer);
	  }

	  function isActivePlayerWin() {
	    return isWinByСross(board)
	      || isWinByСross(mirrorBoard)
	      || isWinBySlash();
	  }

	  function isWinByСross(activeBoard) {
	    const rows = Object.keys(activeBoard);

	    for (const row of rows) {
	      if (Object.values(activeBoard[row]).every(val => val === $activePlayer)) {
	        return true;
	      }
	    }

	    return false;
	  }

	  function isWinBySlash() {
	    const slash = [];
	    const backSlash = [];

	    for (let i = 0; i < scale; i++) {
	      for (let j = 0; j < scale; j++) {
	        if (i === j) {
	          slash.push(board[i][j]);
	        }
	        else if (i + j === scale - 1) {
	          backSlash.push(mirrorBoard[i][j]);
	        }
	      }
	    }

	    if (slash.every(val => val === $activePlayer) || backSlash.every(val => val === $activePlayer)) {
	      return true;
	    }

	    return false;
	  }

		let notActivePlayer;

		$$self.$$.update = ($$dirty = { scale: 1, $activePlayer: 1 }) => {
			if ($$dirty.scale) { for (let row = 0; row < scale; row++) {
	        board[row] = {}; $$invalidate('board', board), $$invalidate('scale', scale);
	        mirrorBoard[row] = {}; $$invalidate('mirrorBoard', mirrorBoard), $$invalidate('scale', scale);
	    
	        for (let col = 0; col < scale; col++) {
	          board[row][col] = '!'; $$invalidate('board', board), $$invalidate('scale', scale);
	          mirrorBoard[row][col] = 'f'; $$invalidate('mirrorBoard', mirrorBoard), $$invalidate('scale', scale);
	        }
	      } }
			if ($$dirty.$activePlayer) { $$invalidate('notActivePlayer', notActivePlayer = $activePlayer === 'X'
	        ? 'O'
	        : 'X'); }
		};

		return {
			matches,
			wins,
			scale,
			gameStatus,
			moves,
			startGame,
			restart,
			makeStep,
			notActivePlayer,
			$activePlayer
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, []);
		}
	}

	const app = new App({
	    target: document.body,
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
