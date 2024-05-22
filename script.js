const CLIENT_ID = "panLq6u0403F3wNx";

let username = getUsername();

const drone = new ScaleDrone(CLIENT_ID, {
  data: {
    name: username,
    color: getRandomColor(),
  },
});

let members = [];

drone.on("open", (error) => {
  if (error) {
    return console.error(error);
  }
  console.log("Successfully connected to Scaledrone");

  const room = drone.subscribe("observable-room");
  room.on("open", (error) => {
    if (error) {
      return console.error(error);
    }
    console.log("Successfully joined room");
  });

  room.on("members", (m) => {
    members = m;
    if (!isRoomValid()) {
      alert("Room is full or invalid user name");
      drone.close();
    } else {
      updateMembersDOM();
    }
  });

  room.on("member_join", (member) => {
    members.push(member);
    if (!isRoomValid()) {
      alert("Room is full or invalid user name");
      drone.close();
    } else {
      updateMembersDOM();
    }
  });

  room.on("member_leave", ({ id }) => {
    const index = members.findIndex((member) => member.id === id);
    members.splice(index, 1);
    updateMembersDOM();
  });

  room.on("data", (text, member) => {
    if (member) {
      addMessageToListDOM(text, member);
    } else {
      // Message is from server
    }
  });
});

drone.on("close", (event) => {
  console.log("Connection was closed", event);
});

drone.on("error", (error) => {
  console.error(error);
});

function getUsername() {
  let name = prompt("What is your name?");
  if (!name || !["Marko", "Janko"].includes(name)) {
    name = "Anonymous";
  }
  return name;
}

function getRandomColor() {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16);
}

function isRoomValid() {
  const validUsers = ["Marko", "Janko"];
  const currentUsers = members.map((member) => member.clientData.name);

  // Provjeri da li su trenutni članovi validni korisnici
  const allValid = currentUsers.every((name) => validUsers.includes(name));

  // Provjeri da li je ime korisnika jedinstveno
  const uniqueUsernames = new Set(currentUsers);
  const isUnique = uniqueUsernames.size === currentUsers.length;

  return allValid && isUnique && currentUsers.length <= 2;
}

//------------- DOM STUFF

const DOM = {
  membersCount: document.querySelector(".members-count"),
  membersList: document.querySelector(".members-list"),
  messages: document.querySelector(".messages"),
  input: document.querySelector(".message-form__input"),
  form: document.querySelector(".message-form"),
};

DOM.form.addEventListener("submit", sendMessage);

function sendMessage(event) {
  event.preventDefault();
  const value = DOM.input.value;
  if (value === "") {
    return;
  }
  DOM.input.value = "";
  drone.publish({
    room: "observable-room",
    message: value,
  });
}

function createMemberElement(member) {
  const { name, color } = member.clientData;
  const el = document.createElement("div");
  el.appendChild(document.createTextNode(name));
  el.className = "member";
  el.style.color = color;
  return el;
}

function updateMembersDOM() {
  DOM.membersCount.innerText = `${members.length} users in room:`;
  DOM.membersList.innerHTML = "";
  members.forEach((member) =>
    DOM.membersList.appendChild(createMemberElement(member))
  );
}

function createMessageElement(text, member) {
  const el = document.createElement("div");
  el.appendChild(createMemberElement(member));
  el.appendChild(document.createTextNode(text));
  el.className = "message";

  if (member.clientData.name === "Janko") {
    el.classList.add("janko");
  } else if (member.clientData.name === "Marko") {
    el.classList.add("marko");
  } else {
    el.style.backgroundColor = getRandomColor();
  }

  return el;
}

function addMessageToListDOM(text, member) {
  const el = DOM.messages;
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.insertAdjacentElement("beforeend", createMessageElement(text, member));
  el.scrollTop = el.scrollHeight; // Automatically scroll to the bottom
  if (wasTop) {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}
