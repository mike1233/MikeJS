import { useApp, useComponent } from "../lib/main";

const body = document.body;

const component = useComponent<{
  title: string;
  count: number;
}>({
  name: "app",
  state: {
    title: "Hello, World!",
    count: 0,
  },
  methods() {
    return {
      handleClick: function () {
        this.count++;
      },
    };
  },
  calculated() {
    return {
      double: function () {
        return this.count * 2;
      },
      readableText: function () {
        return this.title.toUpperCase() + " " + this.count;
      },
    };
  },
  async beforeStart() {
    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts/1"
      );

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }

      const json: {
        title: string;
        userId: number;
        id: number;
        body: string;
      } = await response.json();

      this.title = json.title;
    } catch (error) {
      console.error(error);
    }
  },
  afterStart() {},
  render: () => {
    return `
      <section data-if="title">
        <h1>{{title}}</h1>
        <p>{{count}}</p>
        <p>{{double}}</p>
        <p>{{readableText}}</p>
        <div class="container">
          <button data-click="handleClick">Click me!</button>
        </div>
      </section>
    `;
  },
});

const app = useApp(body, "app");

app.$mount(component);
