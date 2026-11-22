{
  description = "lintel: a greetd login greeter drawn with lyleen, run inside cage";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    # defines system that this flake supports
    systems.url = "github:nix-systems/default";

    # powered by
    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };
  };

  outputs =
    { flake-parts, ... }@inputs:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;

      perSystem =
        {
          pkgs,
          lib,
          ...
        }:
        {
          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              python3
              cage
              greetd
            ];

            shellHook =
              let
                fish_prompt = ./nix/prompt.fish;
              in
              ''
                echo "Initialized lintel Development Environment"
                echo "  ├── $(python3 --version)"
                echo "  ├── $(cage -v 2>&1 | head -n1)"
                echo "  └── greetd ${pkgs.greetd.version} (fakegreet, agreety)"

                # `nix develop` can only ever start bash, so hand the interactive
                # session over to fish. `$-` contains `i` only for the interactive
                # shell, which leaves `nix develop -c <cmd>` and CI runs on bash.
                case $- in
                  *i*) exec ${lib.getExe pkgs.fish} -C 'source ${fish_prompt}' ;;
                esac
              '';
          };

          formatter = pkgs.alejandra;
        };
    };
}
