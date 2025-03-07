# Benchmark Wagtail demo

A demo project to showcase how a Wagtail project template’s output could be benchmarked for energy consumption.

Unlike a real-world project template, this contains enough configuration to run a Wagtail site in four different ways:

1. A "traditional" server-rendered Django + Wagtail + Postgres monolithic stack, served by Gunicorn.
2. A Next.js frontend, server-rendered but with Next.js build-time optimizations, accessing Wagtail data via an API endpoint.
3. A static export of the Next.js frontend, with Wagtail data pre-fetched at build time, served with nginx.
4. A static export of the "traditional" server-rendered HTML, served with nginx.

## Running the demo

For a real-world project template, the first step would be to generate the project from the template. For this demo, the project is already generated.

Here is what the _pretend_ first step would look like:

```bash
# Does not work, this is just an example:
wagtail start mysite --template=https://github.com/thibaudcolas/benchmark-wagtail-template/archive/main.zip
```

From there, the different variants of the site can be run either locally or with Docker – though the benchmarking setup currently relies on Docker.

### gunicorn + Django + Wagtail + Postgres

```bash
docker compose up server_wsgi
```

Then access the container and set up the database:

```bash
docker compose exec server_wsgi bash
# Inside the container:
./manage.py migrate
./manage.py createsuperuser
# Fill in details of your superuser account.
```

Log into the CMS and set up a `HomePage` in place of the default "Welcome to your new Wagtail site!" page.

### Next.js server-rendered

For simplicity, the Next.js demo technically doesn’t talk to the Wagtail backend (see `page.txt`).

```bash
docker compose up server_next
```

### Next.js static export

For simplicity, the demo requires manually exporting the Next.js site before running the Docker container.

```bash
npm i
NEXT_OUTPUT=export npm run build
mv out static_next
docker compose up static_next
```

### Vanilla HTML static export

For simplicity, the demo requires manually exporting the homepage before running the Docker container.
Though a copy of the page is included in the repository.

```bash
mkdir static_wsgi
curl http://localhost:8000/ > static_wsgi/index.html
docker compose up static_wsgi
```

## Benchmarking

We use [GreenFrame](https://greenframe.io/) to get a rough idea of the energy consumption of each stack.
The demo site is too basic for any differences to be very meaningful, but still gives a sense of the methodology.

Once all of the above setup steps have been done, shut down the running containers, and you can start them all together more conveninently with:

```bash
docker compose up
```

Then, in a separate terminal, we can run `docker ps` to get the container IDs and check which container runs on which port:

```text
CONTAINER ID   IMAGE                                COMMAND                  CREATED          STATUS          PORTS                                       NAMES
d22a40679d64   benchmark-wagtail-demo-server_wsgi   "/bin/sh -c 'gunicor…"   20 minutes ago   Up 20 minutes   0.0.0.0:8000->8000/tcp, :::8000->8000/tcp   benchmark-wagtail-demo-server_wsgi-1
2e41d8d1f2e5   benchmark-wagtail-demo-server_next   "docker-entrypoint.s…"   20 minutes ago   Up 20 minutes   0.0.0.0:8002->3000/tcp, :::8002->3000/tcp   benchmark-wagtail-demo-server_next-1
da4e4c76ffb1   benchmark-wagtail-demo-static_wsgi   "/docker-entrypoint.…"   20 minutes ago   Up 20 minutes   0.0.0.0:8003->80/tcp, :::8003->80/tcp       benchmark-wagtail-demo-static_wsgi-1
914bc54f927d   postgres:14.1                        "docker-entrypoint.s…"   20 minutes ago   Up 20 minutes   5432/tcp                                    benchmark-wagtail-demo-db-1
06855bf9d685   benchmark-wagtail-demo-static_next   "/docker-entrypoint.…"   20 minutes ago   Up 20 minutes   0.0.0.0:8004->80/tcp, :::8004->80/tcp       benchmark-wagtail-demo-static_next-1
```

We can then provide those URLs and container IDs to GreenFrame to analyze the energy consumption of each stack:

```bash
rm results.txt
echo '# Results' > results.txt
echo '## db' >> results.txt
greenframe analyze --samples=20 --containers=914bc54f927d http://localhost:8003/ | tee -a results.txt
echo '## server_wsgi' >> results.txt
greenframe analyze --samples=20 --containers=d22a40679d64,914bc54f927d http://localhost:8000/ | tee -a results.txt
echo '## server_next' >> results.txt
greenframe analyze --samples=20 --containers=2e41d8d1f2e5 http://localhost:8002/ | tee -a results.txt
echo '## static_wsgi' >> results.txt
greenframe analyze --samples=20 --containers=da4e4c76ffb1 http://localhost:8003/ | tee -a results.txt
echo '## static_next' >> results.txt
greenframe analyze --samples=20 --containers=06855bf9d685 http://localhost:8004/ | tee -a results.txt
echo '## static_wsgi_db' >> results.txt
greenframe analyze --samples=20 --containers=da4e4c76ffb1,914bc54f927d http://localhost:8003/ | tee -a results.txt
echo '## static_next_db' >> results.txt
greenframe analyze --samples=20 --containers=06855bf9d685,914bc54f927d http://localhost:8004/ | tee -a results.txt
echo '## server_next_db' >> results.txt
greenframe analyze --samples=20 --containers=2e41d8d1f2e5,914bc54f927d http://localhost:8002/ | tee -a results.txt
echo '## server_next_full' >> results.txt
greenframe analyze --samples=20 --containers=2e41d8d1f2e5,d22a40679d64,914bc54f927d http://localhost:8002/ | tee -a results.txt

```

### Benchmarking results

We can then format our results as a table, with the energy consumption of each stack:

| Stack                             | Identifier       | Energy consumption, ±40% (mWh) | Second run, ±40% (mWh) |
| --------------------------------- | ---------------- | ------------------------------ | ---------------------- |
| WSGI server + DB                  | server_wsgi      | 1.091                          | 0.951                  |
| Next.js server                    | server_next      | 1.415                          | 1.545                  |
| Next.js server + WSGI server + DB | server_next_full | 1.959                          | 2.586                  |
| Next.js static export             | static_next      | 3.091                          | 3.563                  |
| Next.js static export + DB        | static_next_db   | 3.482                          | 3.544                  |
| WSGI static export                | static_wsgi      | 0.697                          | 0.658                  |
| WSGI static export + DB           | static_wsgi_db   | 0.66                           | 0.664                  |

## Possible improvements

This is the simplest possible demo of comparing different Wagtail project setups based on their carbon footprint.
There are a lot of ways to make this more interesting, more accurate of a comparison, and more useful for real-world projects:

1. Compare different implementations of Wagtail features within the same stack, rather than different stacks. For example vanilla Wagtail embeds for YouTube videos vs. use of the ["facade" pattern](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades).
2. Compare across different stacks, but with more realistic site setups. For example including more content, more types of content.
3. Include performance metrics (Core Web Vitals, Web Page Test, Lighthouse, Sitespeed.io) in the comparison.
4. Create more realistic benchmarking scenarios. For example covering testing over multiple pages, and interactions with dynamic content.

See [bakerydemo-gold-benchmark](https://github.com/thibaudcolas/bakerydemo-gold-benchmark) for further information on benchmarking Wagtail sites.
