// messages phone
// a message is a string or a list of lines; a line can be {t, c, side, who}. names are <x>, <y>, <z>
var QUOTES = [
  "I’m gonna be the Drake of engineering.",
  "I’m exactly like Chief Keef if he grew up with white privilege.",
  "Pitbull doesn’t give a sh*t about irrelevant cities.",
  "Being positive takes a lot of energy. But so does finding the binormal vector, so.",
  "Sooo Captain Monkey forgot his banana case today.",
  "Stop talking, start shaving.",
  "You’re situated between a rock and, like, itchy grass.",
  "Mark McMorris actually met me.",
  "The drop is like my f*ckin’ dojo of serenity.",
  "Pi was probably a guess-and-check moment.",
  "Like when you’re taking an exam and you look at the guy beside you and say, ‘Well, at least I’m not white!’",
  "I’m back at sphere one.",
  "One day when I’m rich and famous, I’m gonna buy a big ass bag of macadamia nuts.",
  "Ellisp.",
  "I’m gonna put music on that. I’m gonna put Radiohead.",
  "What’s your birthstone? Mine is rock bottom.",
  "Mechanical engineering is dying. Everything’s already been made.",
  "She slaps, just not, like, visually.",
  ["It’s a quiet room.", "What’s in it?", "I don’t know, quiet stuff."],
  "They don’t have cool names! Name one Colin in the NBA.",
  "Listening to Russian music with the sub in the water will get us shot.",
  "Who is Gwyneth Paltrow?",
  "I just feel like everything’s better on a forest service road. Like, there’s just no rules.",
  "You can’t hide a pregnancy, but you can walk away from any shot in the dark.",
  "It’s gonna be awesome. Hot tub, pressure washer, boat launch…!!",
  [{ t: "It probably got flagged for malware.", c: "After their laptop was detained at airport security" }],
  "I really wanna get into sensors. Not because I’m passionate about it, just ’cause it’s the most recent thought I had.",
  "It’s like they say, how fingertips are like riding a bike.",
  "I’ll buy it for you, it’s no skin off my teeth.",
  "My last hairstylist was the devil incarcerated.",
  "He plays hockey, and that’s a little nerve-wracking.",
  "I would do anything for a co-op at John Deere.",
  "@Test NotValid\u200BInvalid\u200BRectangle",
  "Yeah, my thing is working out. <x>’s thing is Minecraft.",
  "This song makes me feel like an owl.",
  "I have not clapped eyes upon it.",
  "Newfoundland isn’t gonna circumcise itself.",
  [{ t: "This song makes me wanna throw some ass.", c: "About “London Bridge” by Fergie" }],
  "Lesson learned, status recovery.",
  "Back in the good ol’ days you could just go around and unplug stuff.",
  "A common problem is that you actually have no idea what’s going on.",
  "Wireless devices are a privilege, not a right.",
  "Custom electron management solutions.",
  "Your attitude talks miles.",
  "It’s got that ejecto seato option.",
  "Life is cool sometimes when it’s not cyberattack.",
  "The M in Marissa stands for malevolent.",
  "Planes are fast, software is slow.",
  "He was such a nice young-looking man.",
  "Friends with Benedicts.",
  "The pendulum swingeth.",
  "Can you avoid tooth decay by going to sleep with a tiny square of chocolate on your tongue, but not touching any of your teeth?",
  "I’m gonna build NASA in there, so get going!",
  "Shirts is easy!",
  "Everyone’s spying on me, and I know they’re spying on me, and I think it’s hilarious that they’re all so fascinated with me…",
  "You know what I do before bed? Eat a clove of raw garlic!",
  "It’s like matrix algebra on steroids, times ten.",
  "It’s like fighting a kangaroo in a telephone booth.",
  [{ t: "Are you guys from La Redonda?", side: "r" }, { t: "No, we’re from Canada.", side: "l" },
   { t: "They’ve also never been to Oovoo Javer.", side: "l", who: 2 }],
  "Never get in a situationship with a girl named Anja. You know how much people say ‘good on ya’?",
  "I will occasionally bash artists that I don’t particularly like. First name starts with T and last name starts with S.",
  "The highest frequency I can hear is much lower than the highest one you guys can hear. I have been tracking it, and it has been going down in a very depressing manner.",
  "I wish there was some way for earthquakes to damage software. What I really want is for you to have to consider earthquake-proofing your code.",
  [{ t: "Name and age.", side: "l" }, { t: "Jason Bourne, 36.", side: "l", who: 2 }],
  "The only thing I like better than a simple lever mechanism is a complicated lever mechanism.",
  [{ t: "I love when it gets quiet when the power goes out.", side: "l" },
   { t: "Yeah, it gets all dark, all the planes fall from the sky…", side: "l", who: 2 }],
  "Do you think that squirrels also find intelligence sexy when looking for a mate?",
  "It’s such night.",
  "You guys ever see someone playing your instrument and you feel like you need to cover your instrument’s eyes so they don’t see, and go like, ‘I wish he would play me like that’? :/",
  "We were just hitting, like, crucial wake and bakes every morning.",
  "He’s a machine. He’s an animal that EATS machines.",
  "I put the hot in psychotic? Yeah, well, I put the dog heartbeat on the back of my car.",
  "I would fail this midterm in a heartbeat.",
  "He has unrepressed childhood trauma.",
  [{ t: "Oops, I don’t see colour.", c: "Lining up to shoot pool with the black ball" }],
  "I gotta fart like a sh*thorse.",
  "You’re a great guy, I hope nothing bad happens to you :)",
  "<x>, <y>, <z> and the Mud Buddies.",
  "NO SOY LISTO.",
  [{ t: "I played guitar for a spider.", side: "r" }, { t: "It’s just like Charlotte’s Web.", side: "l" },
   { t: "Really?", side: "r" },
   { t: "Idk, everything with a spider is like Charlotte’s Web. It’s the only spider story I know besides Spider-Man.", side: "l" }],
  "<x>’s complaining about a business email / and I’m over here asking where’s my snail 🎶",
  "It won’t let me square root this imaginary number :(",
  "While you’re solving P = NP, I’m gonna be facedown getting a massage.",
  "He looks like the guy that looks like the guy from Harry Potter.",
  "I be on my sometimes sh*t.",
  [{ t: "Describe Hawaii in one word.", side: "r" }, { t: "Pretty dope.", side: "l" }],
  "What if the smartwatch could tell what time it was?",
  "I’m not really Mr. Pickle.",
  "My sweet jump era is over.",
  "I used to have a lisp, but my name is Sam Steeves.",
  "I asked Google to play “Mo Bamba” and now everyone keeps telling me I’m a hypebeast.",
  "Chrome is very invasive to me.",
  "What’s he do? That’s it, you’re looking at it. He just looks slick all day.",
  "Caving is kinda dorky.",
  "Pink p*ssy bikini monster. Attack of the bikini monster.",
  "I had a dream that <x> cut off <y>’s head. With a hacksaw. But it was consensual.",
  "Hot tub pressure p*ssy bikini launcher slingshot.",
  "It was an honest mistake, which leads to an honest excuse for doing a bad job on it.",
  "Y’know, skerplunking. Like throwing rocks off of cliffs.",
  "The woman and the suave pathetic loserizer.",
  "The prof is a total goofbag.",
  "Cancún kilncon.",
  "My blood type is B-. My life type is be negative.",
  "His name is Paddington Jitterbug.",
  "What is Homebrew? 😭 Who is pip?",
  "That would be right up his sleeve.",
  "I now have a system to read what I’m writing.",
  [{ t: "Hat alignment and auto service.", c: "An ad for an auto shop in Medicine Hat, AB" }],
  "I don’t f*ck with stupid b*tches.",
  [{ t: "Every day, I learn something that makes me feel a little bit more sick, and eventually, one day, I will die.", c: "After learning women couldn’t fly fighter jets until 1985" }],
  "I spent four hours looking for whales…",
  "It’s not archival. But it’s fine for one lifetime.",
  [{ t: "Those b*tches are gonna leave it in a staff accom.", c: "About the painting that might sell" }],
  "Are you gonna cowboy up or just lay there and bleed?",
  "You catch more flies with honey than you do with sh*t.",
  "It’s not a crime to like hot people.",
  "We’re getting floatplaned to Pretty Girl Lake.",
  [{ t: "I guess that’s why they don’t have government names, because it would be stupid, probably.", c: "About the letters of the alphabet" }],
  "So his roommate dropped out of sociology a while ago, and now he’s just been throwing up a lot.",
  [{ t: "I’ve been wanting all of this stuff for a really long time.", c: "After coming home with three boomerangs, an herb mill, a broken knife and a tomato press", side: "l" },
   { t: "I think I’m gonna pack up all my clothes into storage and just have three outfits. That’s all I really need. Like, it feels so much better to live super minimalist.", c: "Ten minutes later", side: "l" },
   { t: "I think I just made mustard gas.", c: "Whilst cleaning the tomato press with rubbing alcohol and drain cleaner", side: "l" }],
  "Boys aren’t evil, sometimes they just don’t know what they want.",
  "The weather was so changey.",
  "Looks like I’ve been playing chess while you’ve been playing chess like an idiot.",
  "Fool me once? You didn’t."
];

(function () {
  var closed = document.querySelector('.phone-closed');
  var open = document.querySelector('.phone-open');
  if (!closed || !open) return;
  var count = open.querySelector('.quote-count');
  var body = open.querySelector('.quote-body');
  var at = 0;

  for (var i = QUOTES.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var swap = QUOTES[i]; QUOTES[i] = QUOTES[j]; QUOTES[j] = swap;
  }

  function show(n) {
    at = (n + QUOTES.length) % QUOTES.length;
    var lines = [].concat(QUOTES[at]);
    var chat = lines.length > 1;
    body.textContent = '';
    lines.forEach(function (line, k) {
      if (typeof line === 'string') line = { t: line };
      var side = line.side || (chat && k % 2 ? 'r' : 'l');
      var bubble = document.createElement('div');
      bubble.className = 'quote-line' + (chat ? ' is-chat' : '') + (side === 'r' ? ' is-right' : '')
        + (line.who === 2 ? ' is-other' : '');
      var p = document.createElement('p');
      p.textContent = line.t;
      bubble.append(p);
      if (line.c) {
        var note = document.createElement('p');
        note.className = 'quote-context';
        note.textContent = line.c;
        bubble.append(note);
      }
      body.append(bubble);
    });
    count.textContent = (at + 1) + '/' + QUOTES.length;
    body.scrollTop = 0;
  }
  var clock = open.querySelector('.lcd-clock');
  function tick() {
    var now = new Date(), h = now.getHours(), m = now.getMinutes();
    clock.textContent = ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? 'a' : 'p');
  }
  tick();
  setInterval(tick, 15000);

  function flip(toOpen) {
    closed.hidden = toOpen;
    open.hidden = !toOpen;
    document.querySelector('.messages-page').classList.toggle('is-open', toOpen);
    fit();
    (toOpen ? open.querySelector('.phone-key--right') : closed).focus({ preventScroll: true });
  }
  // fit the open phone between the caption and the back link
  var caption = document.querySelector('.messages-caption');
  var back = document.querySelector('.messages-back');
  function fit() {
    if (open.hidden) return;
    var top = caption.getBoundingClientRect().bottom + window.scrollY
      + parseFloat(getComputedStyle(caption).marginBottom);
    var below = back.offsetHeight + parseFloat(getComputedStyle(back).marginTop) + 24;
    var tall = window.innerHeight - top - below;
    var wide = Math.max(90, Math.min(tall / 3.43, 220, window.innerWidth * 0.6));
    open.style.width = wide + 'px';
  }
  window.addEventListener('resize', fit);
  closed.addEventListener('click', function () { show(0); open.classList.remove('is-used'); flip(true); });
  open.addEventListener('click', function (e) {
    if (e.target.closest('.phone-key')) open.classList.add('is-used');
  });
  open.querySelector('.phone-key--left').addEventListener('click', function () { show(at - 1); });
  open.querySelector('.phone-key--right').addEventListener('click', function () { show(at + 1); });
  open.querySelector('.phone-key--end').addEventListener('click', function () { flip(false); });
  document.addEventListener('keydown', function (e) {
    if (open.hidden) return;
    if (e.key === 'ArrowLeft') show(at - 1);
    else if (e.key === 'ArrowRight') show(at + 1);
    else if (e.key === 'Escape') flip(false);
  });
})();
