# Un tween est un trajet

Interpoler, c'est remplir le vide entre deux valeurs. Un tween ne fait rien d'autre :
il prend une propriété, un point de départ, un point d'arrivée, et il fabrique tout ce
qu'il y a entre les deux. Trois choses suffisent à le décrire — d'où l'on part, où l'on
va, et la forme du trajet.

La méthode ne change pas la nature du mouvement : elle change **ce que le code écrit**.
Avec `fromTo`, les deux extrémités y figurent. Avec `to`, seule l'arrivée est déclarée, et
le départ est lu sur l'objet au moment où l'animation démarre. Avec `from`, c'est
l'inverse : l'objet surgit d'une position écrite et revient à sa place de repos. Ce sont
les keyframes implicites de la Web Animations API — l'accolade vide dans le code — et
c'est ce qui rend une animation reprenable en cours de route plutôt que figée.

`set` n'interpole rien. Il occupe la même durée que les autres, et la valeur saute d'un
coup à la fin : en WAAPI, cela s'écrit `steps(1, end)`, la façon native de dire « pas de
trajet ». Le comparer aux trois autres montre par contraste ce que l'interpolation ajoute.

La courbe décide de la vitesse à chaque instant. Le temps s'écoule régulièrement, la
progression non : `ease-out` consomme la moitié de la distance dans le premier quart du
temps. Les fantômes déposés sur la scène marquent la position de l'objet à intervalles
réguliers — leur espacement, c'est la vitesse. Regarde-les se resserrer à l'arrivée quand
la courbe décélère, et s'espacer au départ.

Ici, l'animation n'anime rien directement. Elle sert d'horloge : le navigateur applique la
courbe, le code lit la progression, et la scène en fait une position.
