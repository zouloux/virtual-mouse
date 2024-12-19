# Virtual Mouse

Move a virtual mouse on your website to show features in video.

It has `gsap` as only dependency.

## How it works

It creates a virtual cursor on the screen, over your website.
You can move it and click on elements to simulate user interactions.
It can be useful to create screen captures of your website with a super smooth mouse move.

## Use it on website you don't own

You can use it on websites loaded in chrome, without having to build anything.

Simply open the developer console and load this lib using :
```typescript
import('https://esm.sh/@zouloux/virtual-mouse').then(m => { window.createVirtualMouse = m.createVirtualMouse; console.log("Loaded") })
```

When loaded, you can start to use it 
```typescript
const mouse = createVirtualMouse()
await mouse.delay(.2)
await mouse.move(400, 400)
await mouse.delay(.2)
await mouse.click()
await mouse.delay(.2)
await mouse.hide()
mouse.dispose()
```

### Current features

```typescript
import { createVirtualMouse } from "@zouloux/virtual-mouse"
const mouse = createVirtualMouse({
	// Print actions and parameters
	verbose: false,
	// Smooth the mouse move
	moveDamping: 0,
	// Hide scroll bar, even if moving, can break rendering
	hideScrollbar: true,
	// Hide user cursor, and force it
	hideCursor: true,
	// Block user mouse wheel inputs
	preventMouseWheel: false,
	// Default animation parameters
	defaultAnimate: {
		duration: 1.0,
		ease: 'power4.inOut', // gsap easings
	}
})

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

// Dispose and go back to normal
mouse.dispose()
```

## Hovers

If you need to simulate hovers, call
```typescript
await mouse.initHoversHack()
```

This will load [this lib](https://github.com/TSedlar/pseudo-styler) which permit virtual mouse events to trigger real `:hover` pseudo effects.



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

##### Stage

Create a tool to register clicks and moves and create code.
It will have to smooth everything out.
Maybe by hitting a specific key binding to create a new record.

##### Dependencies

Remove `gsap` as a dependency and make it a unique file.
