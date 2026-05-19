## Harsimar Kaur
For my workflow, I gave ChatGPT the files from our backend project, including the OpenAPI file and sprint instructions, and told it I wanted to make a frontend bug tracker connected to our deployed backend API. I asked it to create a bug tracker with the fields needed for the POST /issues route so users could submit bug reports.

The first version ChatGPT made worked correctly, but the design was very simple. After testing it, I asked ChatGPT to redesign it with more of a black theme and make the layout look cleaner and more organized. The updated version had a darker theme, cleaner buttons, better spacing, and a more modern design. I mainly relied on AI for the styling, layout, and frontend structure while testing the frontend and making adjustments based on how it looked and functioned.

One issue I ran into was deployment and GitHub branch setup. I accidentally made my frontend branch the default branch for the repository, which caused some confusion while setting up deployment. I also had to set up environment variables so the frontend would connect to our deployed backend API instead of localhost.

Overall, I used a process of prompting, testing, changing things, and asking the AI to improve the frontend until it looked and worked the way I wanted.
