export default async function Home() {
  // Commented out for simplicity of the demo.
  // In a real-world implementation, this would need to communicate with the
  // Wagtail API to fetch the page data.
  // const data = await fetch(
  //   `http://server_wsgi:8000/api/v2/pages/?${new URLSearchParams({
  //     type: "home.HomePage",
  //     fields: ["title", "body"].join(","),
  //   })}`,
  //   {
  //     headers: {
  //       Accept: "application/json",
  //     },
  //   }
  // ).then((response) => response.json());
  const data = await new Promise((resolve) => {
    resolve({
      meta: {
        total_count: 1,
      },
      items: [
        {
          id: 3,
          meta: {
            type: "home.HomePage",
            detail_url: "http://localhost:8000/api/v2/pages/3/",
            html_url: "http://localhost:8000/",
            slug: "home",
            first_published_at: "2024-04-01T16:15:26.016114Z",
          },
          title: "Home",
          body: '<p data-block-key="wr8d6">Hello, World!</p>',
        },
      ],
    });
  });

  const page = (data as any).items[0];

  return (
    <>
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.body }} />
    </>
  );
}
