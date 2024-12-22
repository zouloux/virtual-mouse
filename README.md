# Virtual Mouse

Move a virtual cursor on your website to show features in **screencasts** with a **smooth cursor interaction**.

It can be loaded on any website, without access to the source code.

Virtual Mouse also has its **own studio** to create scene from user actions.

- [How it works](#how-it-works)
- [How it works](#how-it-works)

---
## How it works

It creates a virtual cursor on the screen, over your website.
You can move it, scroll and click on elements to simulate user interactions.
It can be useful to create screen captures of your website with a super smooth mouse move.

#### Hovers
Javascript cannot trigger CSS `:hover` pseudo state on DOM elements,
It can work thanks to [this lib](https://github.com/TSedlar/pseudo-styler) which permit virtual mouse to trigger CSS `:hover` like the user's cursor.

It has a known issue when the `:hover` is inside a media query, it can't be triggered.
```css
@media (min-width: 200px) {
	.test:hover {
		// Will not work
	}
}
```

To use it : `await mouse.initHoversHack()`

#### React

React has its own (and now totally useless) `SyntheticEvents` integration.
Which prevents javascript based events to be converted to React elements.
I found a hack to trigger handlers directly on React elements, it may not work on future react version.
Simply give any React node and the code will find how to communicate `SyntheticEvents` on all React nodes. 

To use it : `mouse.initReactEvents( document.body.firstChild ) // any react node will do`

#### Dependencies

It has `gsap` as only dependency. Loaded from `esm.sh` if directly in a browser environment.

---
## Use it, even on websites you don't own

You can use it on websites loaded in chrome, without having to build anything.

Simply open the developer console and load this lib using :
```typescript
const { createVirtualMousePlayer } = await import('https://esm.sh/@zouloux/virtual-mouse')
```

When loaded, you can start to use it 
```typescript
const mouse = createVirtualMousePlayer()
await mouse.delay(.2)
await mouse.move(400, 400)
await mouse.delay(.2)
await mouse.click()
await mouse.delay(.2)
await mouse.hide()
mouse.dispose()
```

## Example

This and example you can copy and paste in any website's console.

```typescript
import { createVirtualMousePlayer } from "@zouloux/virtual-mouse"
const mouse = createVirtualMousePlayer({
	// Hide scroll bar, even if moving, can break rendering
	hideScrollbar: true,
	// Hide user cursor
	hideCursor: true,
	// Print actions and parameters in console
	verbose: false,
	// Block user mouse wheel inputs
	preventMouseWheel: false,
	// Default animation parameters
	defaultAnimate: {
		duration: 1.0,
		ease: 'power4.inOut', // gsap easings
	},
  	// Apply custom style on cursor
	mouseStyle: {
		transform: "translate(-50%, -50%) scale(2)",
		border: "2px solid red",
	},
})

// Enable hovers hack
await mouse.initHoversHack()

// Enable React synthetic events compatibility
mouse.initReactEvents()

// Move mouse to an absolute position in the screen ( not the viewport )
await mouse.to(250, 250)

// Move mouse relatively to its current position
await mouse.move(-100, 0)

// Scroll relatively
await mouse.scroll(0, 200)

// Hide virtual mouse
await mouse.hide()

// Scroll to an absolute position
await mouse.scrollTo(0, 0)

// Show virtual mouse
await mouse.hide()

// Wait 1 second
await delay(1)

// Click on element under virtual mouse
await mouse.click()

// Scroll and move mouse in the same time
mouse.to(500, 500, { duration: 1 }) // no await
await mouse.scroll(0, 500, { duration: 1 })

// Dispose and go back to normal
mouse.dispose()
```

## Viewport size

Because all positions are absolute to the viewport :
When you create a virtual mouse scene, you have to save remember the actual viewport width.
For example, if you create a first scene in 1440px width, add a comment on top of your scene file :

```javascript
// Url : /virtual-mouse-demo.html
// Width: 1440
import { createVirtualMousePlayer } from "@zouloux/virtual-mouse"
const mouse = createVirtualMousePlayer({})
// ...
```


---
## Virtual Mouse Studio

The studio can be helpful to record user actions and convert them to a Virtual Mouse Scene.

Paste this in the developer console on the website you want to animate :

```
const { createVirtualMouseStudio } = await import('https://esm.sh/@zouloux/virtual-mouse')
createVirtualMouseStudio()
```

Then, move your cursor on the website, and click around.
- To register a scroll, use `[CMD]`.
- To finish your scene, hit `[CMD]` + `[Escape]` key on your keyboard.

The scene will be copied to your clipboard and ready to be pasted to play the scene.


---
## Next features

##### Move cursor to an element, centered into it
- `mouse.toElement( element:Element )`
- `mouse.toSelector( selector:string )`

##### Type on keyboard

```
await mouse.toElement('input')
await mouse.click()
await mouse.type("Hello world", 2) // speed
await mouse.key("enter")
```

##### Sounds

Sounds in WebAudio

- Move sound
- Click sound
- Scroll sound
- Type sound
- Key sound

##### Studio

Create a tool to register clicks and moves and create code.
It will have to smooth everything out.
Maybe by hitting a specific key binding to create a new record.

##### Dependencies

Remove `gsap` as a dependency and make it a unique file.
