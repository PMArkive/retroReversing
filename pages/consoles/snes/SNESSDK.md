---
layout: post
tags: 
- snes
- sdk
- intelligentsystems
title: SNES (Super Famicom) Software Development Kit (SDK)
thumbnail: /public/consoles/Super Nintendo Entertainment System.png
image: /public/images/snes/Super Nintendo SDK.jpg
twitterimage: https://www.retroreversing.com/public/images/snes/Super Nintendo SDK.jpg
permalink: /super-famicom-snes-sdk/
breadcrumbs:
  - name: Home
    url: /
  - name: Super Nintendo Entertainment System
    url: /snes
  - name: SNES (Super Famicom) Software Development Kit
    url: #
recommend: 
- sdk
- snes
editlink: /consoles/snes/SNESSDK.md
updatedAt: '2021-07-03'
---

# Official Nintendo Super Famicom SDK
Unlike the original Famicom system, Nintendo provided third party developers with some tools to make Super Famicom development easier.

The tools were created by a subsidiary of Nintendo called Intelligent Systems who would later be responsible for the software development kits for all Nintendo systems.

If you see the acronym **SHVC** in this post or while browsing the SDK it stands for Super Home Video Computer, which was what the SNES was called internally at Nintendo. 

## Files leaked
There are still Super Famicom SDK files that have never been archived or released on the internet unfortunately, so this post will only cover the files we have access to.

The following files have been released to the internet over time:
* **SNES.7z** - Archive distributed by EmuParadise containing Misc SNES SDK Files (SSBUG, SNES Dev book 1 & 2)
* **SNESDEV.rar** - Archive distributed by users on ObscureGamers (SNES Dev book 1 & 2, isspc, TUME, Virtual Boy SDK)
* **SFC_SNES.rar** - Virtual Boy SDK that was forked from the SNES SDK


## Official Documentation
The known scanned in files that we have from Nintendo are:
* **Super Nintendo Development Manual Book 1** - Hardware and assembly documentation
* **Super Nintendo Development Manual Book 2** - SA-1, SuperFX, DSP/DSP1, Accessories
* **IS-Sound Manual** - Japanese Manual for the IS-SOUND development kit
* **IS-Character Manual** - Japanese Manual for the IS-Character development kit used for Sprite/Tile editing

---
## Intelligent Systems SDK
![Fujitsu FMR](https://github.com/user-attachments/assets/000f62c4-bb90-466b-ad83-28b7a06b4747)

The Intelligent Systems SDK would have been installed in `C:\issys` on the developers DOS PC and contained a few tools such as assemblers and linkers.

The SDK has mentions of both the **NEC PC90** and the **Fujitsu FMR** series PCs so it is likely that most of the development was achieved on one of these machines.

However DOS was not the only Operating system used by SNES developers on the PC side.

The documentation for the **HEX2ISX** tool mentions that it supports the **Sony NEWS** assembler called **asm816**, this tool assembles to 65816 machine code which is the Main SNES CPU.

In fact we can see Youtube footage from **Pernoelle** [^10], that shows a programmer working on the Super Nintendo game Pilotwings using an **Sony NEWS** workstation (and IDE) back in 1990, but it is unclear which IDE is being used:
![Pilotwings development](https://github.com/user-attachments/assets/12925c41-58a7-4c79-8333-1341c9499133)
 
This suggests that SNES development at Nintendo was split between the **IBM-PC** compatibles and the Unix-based **Sony NEWS** workstation!

---
## SNES SDK File Formats
There are a number of common file formats that you will find throughout the Super Nintendo SDK files.

You can find a description of these files in the table below:

Extension | Description
---|---
.ASM | Assembly code source file
.EQU | Assembly code header file (definitions)
.ISX | Intelligent Systems Executable file (similar to a ROM but contains debug symbols and needs converted before it can be run on an emulator)
.ISO | Intelligent Systems Object file (assembled version of assembly code)
.X65 | Assembly code for the Main SNES CPU (65816)

### SNES SDK Audio File Formats
The list of known Audio file formats used for SNES development are in the table below:

Extension | Description
---|---
.GAK | Musical Score file created by the **SHVC-MUSIC-EDIT** tool
.SBN | Sound Binary Data
.SOD | Sound Object assembly file listing the instruments that link to .so/.sol
.SO | Converted from .SOL for the **NEWS** sound development tool
.SOL | Sound source data file
.SOP | Similar to the .SO format but has undergone Bit Rate Reduction (Also known as the .so+ format, but the plus symbol is not valid in MSDOS)
.SND | Metadata file that gets compiled with **ISSND**
.SRC | Compiled Musical Score file generated by GAK tools

The conversion tools such as **LHCHG** suggest also having **.B** or **.WB** file formats, but there is no example in the SDK of these files or their usage.

---
## IS-SPC - Intelligent Systems Sound PC Interface
![Sony SPC700](https://github.com/user-attachments/assets/e46a03f8-176e-4fa6-9092-17291cf82d5a)

The Audio processor on the SNES is the **Sony SPC700**, so in order to make music development easier Intelligent Systems (IS) created a few tools and hardware. 

One of these pieces of hardware was known as the **IS-SOUND** which can be used to play and debug audio assembly running on the **Sony SPC700**.

In order to communicate from a DOS-based PC and the IS-SOUND hardware, Intelligent Systems created a SCSI interface and driver known as **IS-SPC**.

The **SNESDEV.rar** archive contains a self extracting LZH file called **isspc.exe** for DOS that when extracted contains all the files required to use IS-SPC Driver for MS-DOS, Windows NT and 95.

When Extracted it contains the following files and folders:
* **95** - Windows 95 Version of the Miniport SCSI Driver (.MPD. .INF)
* **NT** - Windows NT Version of the Miniport SCSI Driver (.MPD. .INF)
* **README.TXT** - Brief description of the main files in Japanese
* **SHVCCHK.EXE** - ROM Check program
* **SS** - SNES Sound SDK folder
* **SSTest** - Duplicated version of the SS folder but with a few new and modified files, it looks like someone was testing the SDK with their own sound files
* **VBU** - Virtual Boy SDK Files (not covered in this post)

### IS-SPC Drivers
It contains 2 drivers, one for the SNES and the other for the IBM-PC both in two different formats, standard and via the **Advanced SCSI Programming Interface** (ASPI). They are located in the root directory of the extracted files:
* **ISASPI.COM** - SCSI Driver on **ASPI** for IBM-PC/AT compatible
* **ISSPCDRV.COM** - SCSI Driver for IBM-PC/AT compatible
* **SNESASPI.COM** - ASPI (Advanced SCSI Programming Interface) Version of the SNES Driver
* **SNESDRV.COM** - Standard SNES SCSI Driver

These files are only useful if you have the rare **IS-SOUND** hardware, or the **SE Emulator**, but the files in the **SS** folder are useful for everyone.

{% include link-to-other-post.html post="/super-famicom-snes-development-kit/" description="For more information about the **IS-SOUND** or SE Emulator check out this post" %}


---
## Sound SDK (/SS folder)
The Software Development Kit contains tools to convert Sound file formats to other formats that can be played inside a SNES ROM. 

So how would a game developer add sound effects or music to their Super Nintendo game using official tools?

It all comes down to a series of files distributed by Nintendo in the **SS** folder. It contains code and tools in order to play sounds using what they have called the Nintendo SPC (N-SPC).

### N-SPC SNES Music Creation Process
It is called the **Nintendo SPC** due to the audio chip in the SNES being the **Sony SPC700**. It also has the alternative Japanese name of **Kankichi** [^2].

It consists of a number of parts:
* Recording Audio Samples for Instruments/Voices (.B/.WB)
* Converting Audio Samples to SNES formats (.SOL)
* Compiling Multiple Instruments into a single file (WAVE.ISX) and meta data (xxxxx.SOD)
* Creating a Musical Score with the **SHVC Gakufu Editor** and save as **.GAK** file
* Convert the Music in .GAK format to Assembly source code (.SRC) for the **SPC700** Audio CPU
* Assemble your generated Asm source (.SRC) and the Nintendo written Kankichi audio driver code to create a **KANKICHI.ISX** file
* Take the Instruments **WAVE.ISX** file and the **KANKICHI.ISX** and generate a Sound Binary data file (SNDDAT.SBN)
* Add the SBOOT assembly files to your standard SNES source code and include the **SNDDAT.SBN** data you generated in the previous step

Each of these parts will be explained in the sections below.

### Audio Samples (B and WB instruments)
The raw wave data needs to be provided as a .WB file which will be used as an instrument/voice for music on the SNES.

It is not clear how developers would create these .WB or .B files, if anyone has any information please reach out!

In the table below you can see a list of tools provided for these Wav file formats:

Name | Description
---|---
B2WB.EXE | Converts .B to .WB files (What are is the difference between them?)
LHCHG.DOC | Documentation for the LHCHG and B2WB/WB2B tools
LHCHG.EXE | Low High Wav file Converter (Changer)
WB2B.EXE | Convert WB format audio to B format audio

In order to use these files on the SNES we need to. convert the .WB file into a SNES .SOL format file which will be covered in the next section.

### Sound Wave maker (SWM) conversion tool
The Sound Wave Maker (SWM) tool seems to take in a **.WB** file as input and produces two files from the sound sample a **.SOL** and a **.WSO**. 

It is the .SOL files that are needed for the SNES but if you want to convert the files into a **Sony NEWS** compatible .so file you need to keep both the .wso and the .sol.

Name | Description
---|---
SME.EXE | SHVC Music Editor (for PC9800)
SME.OVR | DOS memory overlay for SME.EXE
SWM.DAT | 
SWM.EXE | Sound Wave Maker Program
SWM.OVR | DOS memory overlay for SWM.EXE

Now that we have a number of sound objects (instruments) in the SOL format we can proceed.

### Optional: Converting from .SO to .SOL
When using the **Sony NEWS** workstation the sounds are saved in a .SO format that needs to be converted to **.SOL** to be used in the SNES sound code.

Name | Description
---|---
SO2SOL.DOC | Documentation for the **SO2SOL** tool
SO2SOL.EXE | Converts SO Sound files to SOL source files
SOL2SO.DOC | Documentation for **SOL2SO** tool
SOL2SO.EXE | Converts from SOL format file to a SO format file

### Creating a SOD & ISX file from .SOL/.SO files
Now that we have .SOL files for each of our voices/instruments we need to combine them all together into two files, as SOD and an ISX.

To link multiple .SOL files together and generate these two files we use the **SOLLink** tool.

Lets say we have a .SOL file called **mysolfile.sol** we can create an ISX and SOD file list so:
```
sollink / S4000 / XnameOfISX / DnameOfSOD mysolfile
```
This will result in two files being created **nameOfISX.isx** and **nameOfSOD.sod**.

If you have lots of SOD files you can use a Linker file (*.LNK) like so:
```
SOLLINK /Dxxxxx /Xwave @SAMPLE.LNK
```
This will output a SOD file called **xxxxx.SOD** and an ISX file called **wave.ISX**.

The SOD file is a plain text assembly language description of all the SOL files that have been linked into the ISX file with envelope data (see the next section on the SOL file format).

Name | Description
---|---
SOLLINK.DOC | Documentation for **SOLLINK** executable
SOLLINK.EXE | Source Data Linker program by Intelligent Systems


#### SOD File format
It is unconfirmed what **SOD** stands for but our guess would be **Sound Object Descriptor**.

They are plain text files that can be read as assembly code consisting only of Define Byte (DB) instructions.

Normally there are about 26 executable lines of code in this file, one for each of the instruments (SOL files).

Each row consists of 6 bytes, with each of the bytes representing a attribute of an instrument:
* **son** - Sound Sound number (number is used to map to a .SO/.SOL file)
* **AD** - Attack time, decay time (Envelope)
* **SR** - Sustain time, Release time  (Envelope)
* **gain** - Sound gain (Volume?)
* **blk** - ?
* **no.** - ? 


Example:
```
sod
	;	son,ad,sr,gain, blk No 
	;---------------------------------------
	DB	$00, $ff, $e0, $b8, $03, $00	; [00] B:\SMD\SMD5\GB\SE\KABEEP01.SOL
```

You can find more retail SOD files in the Music source code for the game **TopGear** that was leaked on to RomHacking.net.

---
### Musical Score (Gakufu) Tools (SGE)
The Japanese word **Gakufu** means a musical score or sheet Music. So these files are MIDI-like, they contains which instruments to play and at what time.

The following table list all the tools provided in the /SS folder for modifying GAK files:

Name | Description
---|---
GAK.EXE | Musical Score (Gakufu) Convert Utility
GAKCONV.DOC | Documentation for the **GAKCONV** tool
GAKCONV.EXE | Converts to .SRC file from GAKufu-file Program (.GAK)
SGE.ENV | Plain text documentation for SGE
SGE.EXE | SHVC Gakufu Editor (Musical Score editor)
SGE.OVR | DOS memory Overlay file for **SGE.EXE**

The Audio developer would use a tool called the **SHVC Gakufu Editor** (SGE.EXE) to create and edit .GAK files which are similar to MIDI Music files.

#### Convert GAK files to Assembly SRC
After the **.GAK** file has been perfected by the audio engineers it is time to convert it to a format that we can run on the Super Nintendo.

The first step is to convert the GAK file, let's say its called SAMPLE.GAK to a SRC file. You can do this with the useful **GAKCONV** tool like so:
```batch
GAKCONV /Xxxxxx SAMPLE
```

This will result in a file called **xxxxx.SRC** which if you open is actually a plain text file containing assembly code. If you want you can change the name by changed the x characters to a more useful name, but if you do then you will need to change an include statement in code later on in the process so most people just keep it as the xxxxx file name.

We want to build the Gakufu driver called **Kankichi** which is provided by Nintendo in the /SS folder.

The driver is assembled for the Sony Sound CPU (APU) and not the main SNES CPU so we will use a custom assembler provided by Intelligent Systems called **ISSND**.

But first we need to modify the source code to include a link to our .SOD sound object files. The source file is called **kan.asm** and we need to find the lines that have a comment with the word **henko** in it, which is the Japanese word for change.

One is the line to specify the .SOD file:
```
     	include		SOURCE.SOD   	; ** henko **    
```
Change the name **SOURCE.SOD** to the name of your own SOD file, if you don't have a SOD file yet checkout the section above.

You will also notice that near the end of the **kan.asm** is where our generated .src file is included:
```asm
	include		xxxxx.src
```
So if you changed the name from the xxxx default then you will need to change this include statement.

### Assembling KANKICHI Audio driver with your SND file
Now we need a .SND file which is a plain text file that describes how to build an ISX file and is needed by the ISSND sound CPU Assembler.

So lets create one that tells it to build the standard kan.asm file, lets call it **KANKICHI.SND** as that seems to be the standard and put the following contents:
```
a	group	$00
high	=	<>>>
low	=	<<>
	puball
	lib	kan.asm
```
If you have renamed the **kan.asm** file you need to change it here too.

Now lets run it with ISSND and then link the final result into an ISX file like so:
```
ISSND KANKICHI # created KANKICHI.ISO (intelligent Systems Object file)
ISLINK KANKICHI # creates KANKICHI.ISX (Assembled Sound CPU executable code)
```

Now we can test the sound using the SNES debugger called **SHVC.EXE** like so:
```
SHVC SAMPLE1
```

This will read all the assembled **KANKICHI.ISX** Machine code and run it which will play the audio of the first sample.

The files used in this process are described in the table below:

Name | Description
---|---
ISSND.EXE | Sound CPU Macro Assembler
ISLINK.EXE | Linker by Intelligent Systems, creates a ISX file from compiled object files
SHVC.ALI | 
SHVC.CMD | 
SHVC.EXE | Official SNES Debugger (Super Home Video Computer was the codename for the Super Famicom in Japan)
SHVC.HLP | Plain text containing all the commands that can be executed in the SHVC tool
SHVC.KEY | 
SHVCFUNC.TB0 | 
SHVCFUNC.TB1 | 


#### KANKICHI (N-SPC) Sound Driver Sound Code
The files that make up the Kankichi sound driver source code are below:

Extension | Description
---|---
KAN.ASM | Source code for the Driver that runs on the Sound CPU
KAN.EQU | Header file which contains definitions included by KAN.ASM
KANKICHI.DOC | Documentation for the KANKICHI Sound driver
KANKICHI.ISO | Compiled object version of **KAN.ASM**
KANKICHI.SND | Assembly descriptor file for how to build the ISX using **ISSND** tool
L.BAT | Windows Batch file that calls **ISSND** and **ISLINK** tools on KANKICHI driver

For more information on how this sound driver works checkout this excellent page on SNESLab:

{% include link-to-other-site.html url="https://sneslab.net/wiki/N-SPC_Engine" description="For more information about the N-SPC driver check out this page on SNESLab" image="/public/consoles/Super Nintendo Entertainment System.png" title="N-SPC Engine"  %}

### Generate Sound Binary Data from Instruments and assembled Music
Now that we have assembled an ISX file for all the instruments (e.g **WAVE.ISX**) and assembled another ISX file for the Audio Driver (e.g **KANKICHI.ISX**).

We need to combine these files into yet another file format called the **Sound Binary Data** file (SBN).

To do this we can use the **ISX2SBN** tool:
```
ISX2SBN /S800 /XSNDDAT KANKICHI WAVE
```

This will take the Instruments **WAVE.ISX** file and the **KANKICHI.ISX** driver file and generate a Sound Binary data file (**SNDDAT.SBN**) that can be linked into a SNES game.

Name | Description
---|---
ISX2SBN.DOC | Documentation for the **ISX2SBN**
ISX2SBN.EXE | Extract Sound Binary Data file from a compiled ISX file

Finally we will need code to run on the Main CPU to load this sound data and play it in a game, that is what we will do in the next section.

### Sound Boot Program (SBOOT)
The Sound Boot program is a piece of code that you would link into your SNES ROM, it is code that runs on the Main CPU at the start of the game to initialise the APU (Audio Processor Unit).

You need to have created a Sound Binary Data file (.SBN), you can create a SBN file by converting sound ISX files into it with the **isx2sbn** tool which is explained in the sections above.

To build a SNES ROM check the SAMPBoot source code and use the following commands in DOS:
```
IS65 SAMPBOOT
ISLINK SAMPBOOT
SHVC SAMPBOOT
```

Name | Description
---|---
SBOOT.DOC | Documentation for the source code to the Sound Boot program
SBOOT.X65 | Source code for Initialising the Audio processor with some Sound Binary Data (.SBN)


### Other Sound System SDK Tools
The SS folder contains all the tools that are part of the Intelligent Systems SNES SDK, this section will cover the files that we have not listed in previous sections.

Name | Description
---|---
ENV.EXE | Envelope Data Create Utility (by **I.Okita**)
HEX2ISX.DOC | Documentation for the HEX2ISX tool
HEX2ISX.EXE | Convert multiple assembled HEX files into a single Intelligent Systems Executable (ISX)
I2B.EXE | ISX To Binary/ROM converter
INC.EXE | Creates Boot Map File (BOOTDAT.INC)  (by **I.Okita**)
IS65.EXE | SNES Main CPU (6502/65816) Assembler by Intelligent Systems
ISDRNG.TB0 | Contains 10 bytes starting with 0x06 and the rest are 0x00
ISDRNG.TB1 | Contains 10 bytes starting with 0x06 and the rest are 0x00
ISDSYM.TB0 | Contains 12 bytes all are 0x00
ISDSYM.TB1 | Contains 12 bytes all are 0x00
ISPW.EXE | Possibly used to write to EPROM?
OP1.SOD | List of 26 different SOL file references which don't exist in this folder, so possible from another game
SAMPLE.X65 | Sample code for the Main SNES processor
SOAP.COM | Sound Debug tool that runs on the SNES Debugger (SHVC)
SOAP.DOC | Documentation for the Sound Debug tool (**SOAP.COM**) 
SOURCE.SOD | 
XXXXX.SRC | Assembly code Result of compiling a GAK (MIDI-like) file
VERUP | Changelog for IS-SOUND Ver1.10

#### i2b - ISX To Binary/ROM converter
In the SS folder we also have a tool called **i2b** which seems to be able to convert an ISX file into a ROM image for use flashing to a cartridge.

<img src="/public/images/snes/snes i2b tool.jpg" class="wow slideInLeft" />

This is a strange application, it is not written by Intelligent systems or Nintendo and in fact it actively says it doesn't like them when you print the usage information!

---
## SNES Memory Maps Folder (/SS/Map)
The MAP folder contains Japanese documentation about the memory mapping for the Super Nintendo. 

The main file is **MEMORY.MAP** which contains the developer **Toshio Sengoku** notes on how the memory map on the Super Famicom works.

The other two files are for the two different official mapper modes 20 and 21, the file **MAP20.MAP** file contains the un-annotated version that is contained in the standard **MEMORY.MAP** file.


---
# Sculptured Software SDK
The custom third party Software Development Kit for the Super Nintendo created by Sculptured Software has been released online as: 
* SNES Development System Debugger 1.xx

This SDK is to be used along with the Sculptured Software custom development kit hardware.

For more information about the Sculptured Software hardware check out this post:
{% include link-to-other-post.html post="/super-famicom-snes-development-kit/" description="For more information about the **Sculptured Software** development hardware check out this post" %}

Executables:
* **RTM.EXE** - Produced by Borland C++ to load the other tools
* **SASML.EXE** - SNES Assembler
* **SFL2P.EXE** - SFX2Plus Downloader (Downloads ROM to flash cartridge from PC)
* **SLINK.EXE** - SNES Linker (takes in a link file)
* **SSBUG.EXE** - SNES & Mega Drive Debugger

One of the awesome features of this SDK is that it has been written to be cross platform with both the SNES and the Sega Mega Drive, so the same tool such as **SSBUG.EXE** can be used to develop for both systems.

## Nintendo Object Block (NOB) files
In the Help documentation of this SDK (**SBUGHELP.HLP**) it mentions that SSBUG has support for NOB files.

There is no mention of NOB files in the parts of the official SDK that we have access to so we are not sure if this is an official Nintendo format, but the documentation certainly make it look like it is.

## SNES Assemblers
In the files released online we have access to a SNES assembler called **SASML.EXE** created by Sculptured Software Inc.

However reading the **readme.txt** file it mentions a bunch of other assemblers that we do not have:
* SASM - Presumably a 65816 assembler or maybe its a NES 6502 assembler?
* SASM32 - Presumably just 32-bit version of SASM

Having a brief look at the **SASML.EXE** executable it looks like it is a forked version of **SASM.EXE**
65816 assemblers (SASM,SASM32 & SASML/SLINK)


---
# Psy-Q DevKit for Super Nintendo
<section class="postSection">
    <img src="/public/images/snes/SNES%20PSYQ%20Advert.jpg" class="wow slideInLeft postImage" />

 <div markdown="1" class="rr-post-markdown">
**SN Systems** were a company that specialised in creating cross platform development kits for game consoles and the Super Nintendo was no exception.

So far the only part of the Psy-Q development kit that has been archived and released online is the Programmers Guide Documentation.

If anyone has the files that were distributed with the Psy-Q SNES SDK then let us know as it is yet to be archived or documented!
 </div>
</section> 

---
# High Level languages on the SNES (C)
Some games such as **Bubsy 2** may have been written in C, especially by Accolade according to Russell Borogove on twitter [^1].

---
# Other Sound Drivers for the SNES
The **N-SPC/Kankichi** Sound driver that came with the official SDK and has been documented above was far from the only sound driver used on the SNES. In fact there are over 122 unique sound drivers that we know about, and all of them have been documented in detail on the GDRI Wiki. 

If you have any interest in SNES Sound development this is not only a must read but also a site you should bookmark as you will keep coming back to it. 

{% include link-to-other-site.html url="http://gdri.smspower.org/wiki/index.php/Super_Famicom/Super_NES_Sound_Driver_List" description="Check out all the 122 unique sound drivers for the Super Famicom" image="/public/consoles/Super Nintendo Entertainment System.png" title="Super NES Sound Driver List"  %}


---
# References
[^1]: [Russell Borogove on Twitter](https://twitter.com/mister_borogove/status/1122915184014585857)
[^2]: [Kankichi-kun - Video Game Music Preservation Foundation Wiki](http://vgmpf.com/Wiki/index.php?title=Kankichi-kun)
[^3]: [Nintendo Music Format (N-SPC) - Super Famicom Development Wiki](https://wiki.superfamicom.org/nintendo-music-format-(n-spc))
[^4]: [Super NES Sound Driver List](http://gdri.smspower.org/wiki/index.php/Super_Famicom/Super_NES_Sound_Driver_List)
