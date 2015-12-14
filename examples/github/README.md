## Running the Example

We've built a simple issue manager CLI to show how to use Shred to wrap an API like GitHub's.

1. Change to the `examples/github` directory.

  ```
  cd examples/github
  ```

2. List the issues in the Shred repo.

  ```
  coffee cli.coffee list -o pandastrike -r shred
  ```

3. If you want to create issues using the CLI, add a GitHub API token.

  ```
  cat >> .token
  paste your token here
  ^D
  ```

4. Create a new issue.

  ```
  coffee cli.coffee create -o pandastrike -r shred \
    -t 'My Ticket Title' -b "My ticket's body"
  ```
