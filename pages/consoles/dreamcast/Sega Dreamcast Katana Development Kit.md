---
layout: post
tags: 
- dreamcast
- dc
- hardware
- devkit
- sega
title: Sega Dreamcast Katana Development Kit Hardware
thumbnail: /public/consoles/Sega Dreamcast.png
image: https://img.youtube.com/vi/kuff6PgoEuc/hqdefault.jpg
permalink: /Sega-Dreamcast-Katana-Development-Kit
breadcrumbs:
  - name: Home
    url: /
  - name: Sega Dreamcast
    url: /dc
  - name: Sega Dreamcast Katana Development Kit
    url: #
videocarousel:
  - title: Sega Dreamcast Development Hardware Collection
    image: https://img.youtube.com/vi/yia0jHPFfA4/0.jpg
    youtube: 'yia0jHPFfA4'
  - title: Sega Dreamcast Katana Development Kit (Earlier Development Kit)
    image: https://img.youtube.com/vi/kuff6PgoEuc/0.jpg
    youtube: 'kuff6PgoEuc'
  - title: Sega Dreamcast Dev Kit Overview of buttons and ports
    image: https://img.youtube.com/vi/upUbGLl9vJg/0.jpg
    youtube: 'upUbGLl9vJg'
  - title: Sega Dreamcast Dev Kit Capturing in game screenshots (DC Capture)
    image: https://img.youtube.com/vi/qU3l5RUswgA/0.jpg
    youtube: 'qU3l5RUswgA'
recommend: sega
references:
- The Adequate Gamer
- MrMario2011
- Dreamcast Hub
redirect_from:
  - /Sega-Dreamcast-System-Disc-2
editlink: /consoles/dreamcast/Sega Dreamcast Katana Development Kit.md
---

# Official Sega Development hardware
In Sega's internal model numbering system for the Dreamcast, the prefix "HKT" is consistently used across various hardware components and peripherals. While the exact meaning of "HKT" has not been officially disclosed by Sega, it's widely believed that "KT" stands for "Katana," the codename for the Dreamcast during its development phase. The "H" could plausibly represent "Hardware," indicating that "HKT" denotes "Hardware Katana." This interpretation aligns with Sega's practice of using specific prefixes to categorize their hardware products systematically. For instance, the Dreamcast's development kit was known as the "Katana Development Kit," and its model number was HKT-01.

---
## Sega Katana Development Box (HKT-0100)

### Set 4 Development hardware
This is a Set4 evelopment kit. It preceded the more familiar Set5 (HKT-0120) units and shipped in this rudimentary beige PC ATX mini tower. There is no GD-ROM drive but a GD-M emulator board is inside as well as a 4GB HDD and SCSI interface...[^6]
![Set 4 Dreamcast Hardware](https://github.com/user-attachments/assets/8c9e31fc-ff0a-47f6-998b-dc4f419c8234)

Here is an example up and running from Shane Battye, the host PC (out of frame) contains an Adaptec 2940 SCSI adapter and runs Win95/98 compatible SDK:
![Set 4 Dreamcast Teapot Demo with Saturn Controller](https://github.com/user-attachments/assets/f22cbe5a-6a34-4d01-adaf-e235e818cac8)

To keep prototyping costs down, they built the system to an ATX form factor, and used a standard ATX power supply, it is presumed that only 1000 Set 4 F3 kits were made [^4].

### Set 5 Katana Development Hardware (HKT-0120)
The Set 5 Dreamcast Development  Hardware was the most common seen the in the wild and came with a GD-ROM Drive:
![image](https://github.com/user-attachments/assets/3a0b4e3f-ed5e-4829-9b57-ec2b02250c55)

It also had a unique boot animation:
<blockquote class="twitter-tweet"><p lang="et" dir="ltr">Sega <a href="https://twitter.com/hashtag/Dreamcast?src=hash&amp;ref_src=twsrc%5Etfw">#Dreamcast</a> <a href="https://t.co/bkqq4OInS8">https://t.co/bkqq4OInS8</a> HKT-0120 boot animation <a href="https://t.co/1l96Ze6w2s">pic.twitter.com/1l96Ze6w2s</a></p>&mdash; Shane Battye🎄 🎮 (@shanebattye) <a href="https://twitter.com/shanebattye/status/1104989541188874241?ref_src=twsrc%5Etfw">March 11, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Controller Box (HKT-0200)
The **Set 4** and below didn't have controller ports so it required a **Controller Box HKT-0200** which you can plug Sega Saturn Controllers into with four slots on top for prototype VMUs [^5].

---
## Katana Midi Sound Box (HKT-0300)


---
## GD-Writer (HKT-0400)
The GD-Writer is used by developers to burn GD-R discs which are a writable version of the Dreamcast GD-ROMs.

You can see the GD-Writer in action in this video by Adam Koralik [^1]:
<iframe width="560" height="315" src="https://www.youtube.com/embed/hqMWTJe3ioE" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

In order to use the GD-Writer hardware you would need to run a program called GD Workshop on your dreamcast DEV.BOX.

{% include link-to-other-post.html post="/dreamcast-gd-workshop/" description="For information about GD Workshop check out this post." %}

---
## Cross Products Dreamcast GD-ROM Duplicator GD-X (HKT-0500)
Hardware unit to duplicate GD-ROMs, not used for development but useful for duplicating discs for testers.

You can see a video of the GD-X Duplicator by Adam Koralik here [^3]:
<iframe width="560" height="315" src="https://www.youtube.com/embed/rszqxcnOmCA" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## GD-R (HKT-0600)
![Dreamcast HKT-0600](https://github.com/user-attachments/assets/0c9edb14-155e-4df5-bcdb-b7c4f0883f03)
The GD-R was a writable Gigabyte dreamcast disc and came in two colors blue and orange, many prototype Dreamcast games are found on this format.

---
## Sega Katana C1/C2 Checker (HKT-0700)
![Sega C1/C2 Checker](https://github.com/user-attachments/assets/fa023215-1446-4c5f-a08e-73da3fe77011)
The HKT-0700 Sega Katana C1/C2 Checker is a peripheral device for the Sega Dreamcast Hard C1-Checker & the Sega Dreamcast Development Box, and it served as an address checker. 

The Hard-C1 Checker looks very similar to a retail Dreamcast unit. The only differences are that it has a switch and light on the top of the unit, as well as a serial port on the front.

---
## System Disk 2 (HKT-0900)
<iframe width="560" height="315" src="https://www.youtube.com/embed/TL0VCLGev7A" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

In order to help prevent alpha and beta games being leaked to the public, Sega made sure that an additional disc was required to run developer burned GD-Rs [^2].

This additional disc was known as the Sega Dreamcast System Disc 2.

In order to run any developer-burned games you would need to insert the disc into either a standard dreamcast or development kit which would then ask for the burned disc to be inserted.

This additional layer of security helped game development studios put their mind at ease when sending prototypes or final review candidates to third parties such as games magazine publishers for review.

The GD-R discs are writeable versions of GD-ROMs and are burned by developers using their Dreamcast development kits `DEV.BOX` using a program called the `GD Workshop`.

{% include link-to-other-post.html post="/sega-dreamcast-gd-workshop" description="You can find out about the GD Workshop in this post." %}



---
# References
[^1]: [Keep Dreaming - Sega Dreamcast GD-Writer HKT-04 - Adam Koralik - YouTube](https://www.youtube.com/watch?v=hqMWTJe3ioE)
[^2]: [System Disc 2 for Sega Dreamcast development Overview and instructional - YouTube](https://www.youtube.com/watch?v=TL0VCLGev7A)
[^3]: [Keep Dreaming - Sega Dreamcast GD-X Duplicator HKT-01 - Adam Koralik - YouTube](https://www.youtube.com/watch?v=rszqxcnOmCA)
[^4]: [Dreamcast - Sega Dreamcast SET4 F3 Development Kit - ObscureGamers - Prototopia](https://web.archive.org/web/20190923150812/https://www.obscuregamers.com/threads/sega-dreamcast-set4-f3-development-kit.336/)
[^5]: [HKT-0200 - Sega Katana Controller Box - SegaXtreme](https://segaxtreme.net/threads/hkt-0200-sega-katana-controller-box.15500/)
[^6]: [Shane Battye🎄 🎮 (@shanebattye)](https://web.archive.org/web/20201007141308/https://twitter.com/shanebattye/status/1313840041219637252)
