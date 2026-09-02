{
  description = "Coffeelog Monorepo Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      utils,
    }:
    utils.lib.eachSystem [
      "aarch64-darwin"
      "x86_64-linux"
    ] (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        pnpmPinned = pkgs.pnpm.overrideAttrs (finalAttrs: _previousAttrs: {
          version = "11.11.0";
          src = pkgs.fetchurl {
            url = "https://registry.npmjs.org/pnpm/-/pnpm-${finalAttrs.version}.tgz";
            hash = "sha256-he8u/yFqGukIBMAMjfv6ZoU1NkRlDRCQaok8Ba7c2IQ=";
          };
        });
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bashInteractive
            coreutils
            curl
            git
            gnugrep
            betterleaks
            nodejs_24
            pnpmPinned
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            echo "☕ Coffeelog Monorepo Development Environment"
            echo "Node.js: $(node --version)"
            echo "pnpm: $(pnpm --version)"
          '';
        };
      }
    );
}
